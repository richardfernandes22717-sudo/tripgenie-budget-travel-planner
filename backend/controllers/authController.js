const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { success, failure } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

function accessToken(user) {
  return jwt.sign({ sub:user.id, role:user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
}
async function issueRefreshToken(userId, req) {
  const token = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 30);
  await pool.execute('INSERT INTO authentication_sessions (user_id, token_hash, user_agent, ip_address, expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(), INTERVAL ? DAY))', [userId, hash, req.get('user-agent')?.slice(0,250)||null, req.ip, days]);
  return token;
}
const register = asyncHandler(async (req,res) => {
  const { name,email,password,phone=null } = req.body;
  const [exists] = await pool.execute('SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
  if (exists[0]) return failure(res,'Email already registered',409);
  const hash = await bcrypt.hash(password,12);
  const [result] = await pool.execute('INSERT INTO users (name,email,password_hash,phone) VALUES (?,?,?,?)',[name,email.toLowerCase(),hash,phone]);
  const user={id:result.insertId,name,email:email.toLowerCase(),role:'user',status:'active'};
  return success(res,{ user, accessToken:accessToken(user), refreshToken:await issueRefreshToken(user.id,req) },'Registration successful',201);
});
const login = asyncHandler(async (req,res) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email=? LIMIT 1',[req.body.email.toLowerCase()]);
  const user=rows[0];
  if(!user || !(await bcrypt.compare(req.body.password,user.password_hash))) return failure(res,'Invalid email or password',401);
  if(user.status!=='active') return failure(res,'Account is not active',403);
  await pool.execute('UPDATE users SET last_login_at=NOW() WHERE id=?',[user.id]);
  const safe={id:user.id,name:user.name,email:user.email,phone:user.phone,profile_image:user.profile_image,role:user.role,status:user.status};
  return success(res,{user:safe,accessToken:accessToken(user),refreshToken:await issueRefreshToken(user.id,req)},'Login successful');
});
const refresh = asyncHandler(async(req,res)=>{
  const hash=crypto.createHash('sha256').update(req.body.refreshToken||'').digest('hex');
  const [rows]=await pool.execute(`SELECT s.id session_id,u.id,u.name,u.email,u.role,u.status FROM authentication_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>NOW()`,[hash]);
  if(!rows[0]||rows[0].status!=='active') return failure(res,'Invalid refresh token',401);
  return success(res,{accessToken:accessToken(rows[0])},'Token refreshed');
});
const logout=asyncHandler(async(req,res)=>{
  if(req.body.refreshToken){const hash=crypto.createHash('sha256').update(req.body.refreshToken).digest('hex');await pool.execute('UPDATE authentication_sessions SET revoked_at=NOW() WHERE token_hash=?',[hash]);}
  return success(res,null,'Logged out');
});
const me=asyncHandler(async(req,res)=>success(res,req.user));
const updateProfile=asyncHandler(async(req,res)=>{
  const {name,phone}=req.body; const image=req.file?`/uploads/${req.file.filename}`:req.body.profile_image;
  await pool.execute('UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), profile_image=COALESCE(?,profile_image) WHERE id=?',[name||null,phone??null,image||null,req.user.id]);
  const [rows]=await pool.execute('SELECT id,name,email,phone,profile_image,role,status FROM users WHERE id=?',[req.user.id]); return success(res,rows[0],'Profile updated');
});
const getPreferences=asyncHandler(async(req,res)=>{const [r]=await pool.execute('SELECT * FROM user_preferences WHERE user_id=?',[req.user.id]);return success(res,r[0]||null);});
const savePreferences=asyncHandler(async(req,res)=>{
 const b=req.body; const vals=[req.user.id,JSON.stringify(b.interests||[]),JSON.stringify(b.preferred_cuisines||[]),JSON.stringify(b.dietary_requirements||[]),b.hotel_preference||'budget',b.transport_preference||'mixed',b.travel_style||'balanced',JSON.stringify(b.preferred_activities||[]),b.default_currency||'INR'];
 await pool.execute(`INSERT INTO user_preferences (user_id,interests,preferred_cuisines,dietary_requirements,hotel_preference,transport_preference,travel_style,preferred_activities,default_currency) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE interests=VALUES(interests),preferred_cuisines=VALUES(preferred_cuisines),dietary_requirements=VALUES(dietary_requirements),hotel_preference=VALUES(hotel_preference),transport_preference=VALUES(transport_preference),travel_style=VALUES(travel_style),preferred_activities=VALUES(preferred_activities),default_currency=VALUES(default_currency)`,vals);
 const [r]=await pool.execute('SELECT * FROM user_preferences WHERE user_id=?',[req.user.id]);return success(res,r[0],'Preferences saved');
});
module.exports={register,login,refresh,logout,me,updateProfile,getPreferences,savePreferences};
