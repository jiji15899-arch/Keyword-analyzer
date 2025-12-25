import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Lock, LogOut, Settings, CreditCard, User, Mail, Shield } from 'lucide-react';

const KeywordAnalyzer = () => {
  const [kws, setKws] = useState([]);
  const [load, setLoad] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [nick, setNick] = useState('');
  const [pass, setPass] = useState('');
  const [showPay, setShowPay] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [acc, setAcc] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showBL, setShowBL] = useState(false);

  const ADMIN = { nick: 'jiwungumadmin', pass: 'jiwungum327key' };

  const sim = (s1, s2) => {
    const len = Math.max(s1.length, s2.length);
    if (!len) return 100;
    let m = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i].toLowerCase() === s2[i].toLowerCase()) m++;
    }
    return (m / len) * 100;
  };

  const getBL = () => JSON.parse(localStorage.getItem('bl') || '[]');
  const addBL = (n) => { 
    if (n === ADMIN.nick) return;
    const b = getBL(); 
    if (!b.includes(n)) { 
      b.push(n); 
      localStorage.setItem('bl', JSON.stringify(b)); 
    } 
  };
  const inBL = (n) => getBL().includes(n);

  const checkBL = (n, p) => {
    for (const bn of getBL()) {
      const u = localStorage.getItem(`u_${bn}`);
      if (!u) continue;
      const ud = JSON.parse(u);
      if (sim(n, bn) >= 30 || sim(p, ud.pass) >= 40) return true;
    }
    return false;
  };

  const updCredit = (n, c) => {
    if (n === ADMIN.nick) return;
    const u = localStorage.getItem(`u_${n}`);
    if (!u) return;
    const ud = JSON.parse(u);
    const nc = Math.max(0, Math.min(900, (ud.credit || 900) + c));
    ud.credit = nc;
    if (nc < 300) {
      addBL(n);
      localStorage.removeItem(`u_${n}`);
      localStorage.removeItem('kwu');
      alert('신용도 300점 미만 블랙리스트 등재+탈퇴');
      setUser(null);
      setShowAuth(true);
      return;
    }
    if (nc >= 300 && nc <= 400) {
      const s = new Date();
      s.setMonth(s.getMonth() + 1);
      ud.suspend = s.toISOString();
    }
    localStorage.setItem(`u_${n}`, JSON.stringify(ud));
    if (user?.nick === n) setUser({...user, credit: nc, suspend: ud.suspend});
  };

  useEffect(() => {
    const u = localStorage.getItem('kwu');
    if (u) {
      const ud = JSON.parse(u);
      const full = localStorage.getItem(`u_${ud.nick}`);
      if (full) {
        const f = JSON.parse(full);
        if (f.suspend && new Date() < new Date(f.suspend)) {
          alert(`제재중 ${new Date(f.suspend).toLocaleDateString()}까지`);
          logout();
          return;
        }
      }
      setUser(ud);
      setShowAuth(false);
      loadData(ud.nick);
    }
    setAcc(localStorage.getItem('acc') || '');
  }, []);

  const loadData = (n) => {
    const d = localStorage.getItem(`kwd_${n}`);
    if (d) setKws(JSON.parse(d).kws || []);
  };

  const saveData = (n, k) => localStorage.setItem(`kwd_${n}`, JSON.stringify({kws: k}));

  const auth = () => {
    if (!nick || !pass) return alert('닉네임과 비밀번호 입력');
    if (inBL(nick)) return alert('블랙리스트 사용자');
    
    if (authMode === 'signup') {
      if (checkBL(nick, pass)) return alert('블랙리스트 유사 정보');
      if (localStorage.getItem(`u_${nick}`)) return alert('이미 존재');
      localStorage.setItem(`u_${nick}`, JSON.stringify({ nick, pass, premium: null, credit: 900 }));
      alert('가입완료 신용도 900');
    }
    
    const u = localStorage.getItem(`u_${nick}`);
    if (!u) return alert('없는 사용자');
    const ud = JSON.parse(u);
    if (ud.pass !== pass) return alert('비번 틀림');
    if (ud.suspend && new Date() < new Date(ud.suspend)) return alert(`제재중 ${new Date(ud.suspend).toLocaleDateString()}까지`);
    
    const isAdmin = nick === ADMIN.nick && pass === ADMIN.pass;
    const user = { ...ud, isAdmin };
    setUser(user);
    localStorage.setItem('kwu', JSON.stringify(user));
    setShowAuth(false);
    loadData(nick);
  };

  const logout = () => { setUser(null); localStorage.removeItem('kwu'); setShowAuth(true); setKws([]); };

  const hasPrem = () => user?.isAdmin || (user?.premium && new Date() < new Date(user.premium));

  const reqPay = () => {
    if (!acc) return alert('관리자 계좌 미설정');
    setShowPay(true);
  };

  const payMethod = (m) => {
    const e = prompt('Gmail 주소:');
    if (!e?.includes('@gmail.com')) return alert('유효한 Gmail');
    setEmail(e);
    alert(`${m}로 ${acc}에 10,000원 송금\n${e}로 인증코드 발송예정`);
    setShowPay(false);
    setShowCode(true);
  };

  const verifyCode = () => {
    const stored = localStorage.getItem(`ac_${user.nick}`);
    if (!stored) { updCredit(user.nick, -15); return alert('인증코드 없음 -15점'); }
    if (code !== stored) { updCredit(user.nick, -15); return alert('코드 틀림 -15점'); }
    
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 1);
    const u = { ...user, premium: exp.toISOString() };
    setUser(u);
    localStorage.setItem(`u_${user.nick}`, JSON.stringify(u));
    localStorage.setItem('kwu', JSON.stringify(u));
    localStorage.removeItem(`ac_${user.nick}`);
    setShowCode(false);
    setCode('');
    alert('프리미엄 활성화 30일');
  };

  const setAccount = () => {
    const a = prompt('토스뱅크 계좌:');
    if (a) { setAcc(a); localStorage.setItem('acc', a); alert('계좌 설정완료'); }
  };

  const genCode = () => {
    const n = prompt('사용자 닉네임:');
    if (!n || !localStorage.getItem(`u_${n}`)) return alert('없는 사용자');
    const c = Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem(`ac_${n}`, c);
    alert(`코드: ${c}\n사용자: ${n}\nGmail 전송필요`);
  };

  const penalty = () => {
    const n = prompt('사용자 닉네임:');
    if (!n) return;
    if (n === ADMIN.nick) return alert('관리자는 제재 불가');
    const r = prompt('1.부적절결제(15점) 2.해킹(블랙)');
    if (r === '1') { updCredit(n, -15); alert(`${n} -15점`); }
    else if (r === '2') { addBL(n); localStorage.removeItem(`u_${n}`); alert(`${n} 블랙+탈퇴`); }
  };

  const grade = (c, p, t) => {
    const s = (100 - c) * 0.3 + p * 0.4 + t * 0.3;
    return s >= 85 ? 'S' : s >= 70 ? 'A' : s >= 55 ? 'B' : 'C';
  };

  const addVar = (v, r = 5) => Math.max(0, Math.min(100, v + (Math.random() - 0.5) * r));

  const analyze = (k) => {
    let c = 50, p = 70, t = 75;
    if (k.includes('청년')||k.includes('신청')) { p += 15; t += 10; }
    if (k.includes('지원금')||k.includes('보조금')) p += 10;
    if (k.includes('2025')||k.includes('2026')) { t += 15; c -= 10; }
    if (k.includes('방법')||k.includes('조회')) { p += 12; t += 8; }
    if (k.includes('연말정산')||k.includes('현금영수증')) { p += 14; t += 12; }
    if (k.length > 15) c -= 5;
    return { c: Math.max(10, Math.min(95, c)), p: Math.max(50, Math.min(98, p)), t: Math.max(60, Math.min(98, t)) };
  };

  useEffect(() => {
    const int = setInterval(() => {
      if (kws.length && !load && user) {
        setKws(prev => prev.map(k => {
          const c = addVar(k.bc, 3), p = addVar(k.bp, 2), t = addVar(k.bt, 2);
          return { ...k, c, p, t, g: grade(c, p, t), sv: Math.floor(addVar(k.sv, k.sv * 0.05)) };
        }));
      }
    }, 60000);
    return () => clearInterval(int);
  }, [kws, load, user]);

  const fetch = async () => {
    if (!user) return alert('로그인 필요');
    setLoad(true);
    await new Promise(r => setTimeout(r, 10000));
    
    const list = ['기초연금 탈락 이유', '연금복권 당첨번호', '운전자보험 개정', '운전자보험 개정 2026', '금 한돈 매입 방법', '실시간 금 시세', '1돈 구매 방법', '은 시세 실시간 조회', '2026 연말정산 현금영수증', '홈택스 전자세금계산서 조회', '두루누리 지원금 신청', '청년근속 인센티브'];
    
    const res = list.map(k => {
      const a = analyze(k);
      const c = addVar(a.c, 5), p = addVar(a.p, 3), t = addVar(a.t, 3);
      return { k, bc: a.c, bp: a.p, bt: a.t, c, p, t, g: grade(c, p, t), sv: Math.floor(Math.random() * 50000) + 10000, cpc: Math.floor(Math.random() * 3000) + 500 };
    });
    
    res.sort((a, b) => {
      const go = { S: 0, A: 1, B: 2, C: 3 };
      return go[a.g] !== go[b.g] ? go[a.g] - go[b.g] : b.p - a.p;
    });
    
    setKws(res);
    saveData(user.nick, res);
    setLoad(false);
  };

  const gc = (g) => ({ S: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', A: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white', B: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white', C: 'bg-gradient-to-r from-gray-600 to-slate-600 text-white' }[g]);

  const canView = (g) => g === 'B' || g === 'C' || hasPrem();

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 w-full max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">💰 키워드 분석기</h1>
          <div className="space-y-4">
            <input type="text" placeholder="닉네임" value={nick} onChange={e => setNick(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/50" />
            <input type="password" placeholder="비밀번호" value={pass} onChange={e => setPass(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/50" />
            <button onClick={auth} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-bold">{authMode === 'login' ? '로그인' : '회원가입'}</button>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-purple-300 text-sm">{authMode === 'login' ? '회원가입' : '로그인'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">💰 정부지원금 키워드</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <User className="text-purple-300" size={16} />
                  <span className="text-purple-200 text-sm sm:text-base">{user?.nick}</span>
                  {user?.isAdmin && <span className="text-yellow-300 text-xs">(관리자)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={user?.credit >= 700 ? "text-green-400" : user?.credit >= 400 ? "text-yellow-400" : "text-red-400"} size={16} />
                  <span className={`text-sm sm:text-base ${user?.credit >= 700 ? "text-green-300" : user?.credit >= 400 ? "text-yellow-300" : "text-red-300"}`}>신용도: {user?.isAdmin ? '900(관리자)' : user?.credit || 900}</span>
                </div>
                {!hasPrem() && !user?.isAdmin && <span className="text-red-300 text-xs sm:text-sm">무료(B~C)</span>}
                {hasPrem() && !user?.isAdmin && <span className="text-green-300 text-xs sm:text-sm">프리미엄</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {user?.isAdmin && <button onClick={() => setShowAdmin(!showAdmin)} className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"><Settings size={18} />관리</button>}
              {!hasPrem() && !user?.isAdmin && acc && <button onClick={reqPay} className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"><CreditCard size={18} />결제</button>}
              <button onClick={fetch} disabled={load} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base"><RefreshCw className={load ? 'animate-spin' : ''} size={18} />{load ? '분석중' : '분석'}</button>
              <button onClick={logout} className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg"><LogOut size={18} /></button>
            </div>
          </div>

          {showAdmin && user?.isAdmin && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4 space-y-3">
              <h3 className="text-yellow-300 font-bold">관리자</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={acc} onChange={e => setAcc(e.target.value)} placeholder="토스뱅크 계좌" className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white" />
                <button onClick={setAccount} className="bg-yellow-600 text-white px-4 py-2 rounded-lg">설정</button>
              </div>
              {acc && <p className="text-yellow-200 text-sm">계좌: {acc}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={genCode} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">인증코드발급</button>
                <button onClick={penalty} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">신용도차감</button>
                <button onClick={() => setShowBL(!showBL)} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">블랙리스트</button>
              </div>
              {showBL && (
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-red-300 font-bold mb-2">블랙리스트</p>
                  {getBL().length ? <ul className="text-white text-sm">{getBL().map((n, i) => <li key={i}>• {n}</li>)}</ul> : <p className="text-gray-400 text-sm">없음</p>}
                </div>
              )}
            </div>
          )}

          {showPay && (
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 mb-4">
              <h3 className="text-white font-bold text-lg sm:text-xl mb-4">프리미엄 10,000원/월</h3>
              <p className="text-purple-200 mb-4 text-sm sm:text-base">Gmail로 인증코드 발송</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {['Visa', '신한은행', '토스뱅크', '국민은행', '우리은행', 'Mastercard', '하나은행', '카카오뱅크'].map(m => (
                  <button key={m} onClick={() => payMethod(m)} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold hover:opacity-80 text-sm">{m}</button>
                ))}
              </div>
              <button onClick={() => setShowPay(false)} className="mt-4 text-gray-300 text-sm">닫기</button>
            </div>
          )}

          {showCode && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-6 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="text-green-400" size={20} />
                <h3 className="text-white font-bold text-lg sm:text-xl">인증코드 입력</h3>
              </div>
              <p className="text-green-200 mb-4 text-sm sm:text-base">Gmail({email}) 발송된 코드</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="코드입력" className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white" />
                <button onClick={verifyCode} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold">확인</button>
              </div>
              <p className="text-yellow-300 text-sm mt-2">⚠️ 틀리면 -15점</p>
            </div>
          )}
        </div>

        {load && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 sm:p-12 text-center mb-6">
            <RefreshCw className="animate-spin mx-auto mb-4 text-purple-400" size={40} />
            <p className="text-white text-lg sm:text-xl font-semibold">크롤링중...</p>
          </div>
        )}

        {!load && kws.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white font-bold text-sm sm:text-base">등급</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white font-bold text-sm sm:text-base">키워드</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white font-bold text-sm sm:text-base">검색량</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white font-bold text-sm sm:text-base">경쟁도</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white font-bold text-sm sm:text-base">수익성</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white font-bold text-sm sm:text-base">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {kws.map((k, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-3 sm:px-6 py-3 sm:py-4"><span className={`${gc(k.g)} px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-base sm:text-lg`}>{k.g}</span></td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-white font-semibold text-sm sm:text-base">{canView(k.g) ? k.k : <div className="flex items-center gap-2"><Lock size={14} className="text-red-400" /><span className="text-xs sm:text-sm">프리미엄</span></div>}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-purple-300 font-semibold text-sm sm:text-base">{canView(k.g) ? k.sv.toLocaleString() : '***'}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        {canView(k.g) ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 sm:w-24 bg-gray-700 rounded-full h-2"><div className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full" style={{ width: `${k.c}%` }} /></div>
                            <span className="text-white font-semibold text-xs sm:text-sm">{Math.round(k.c)}%</span>
                          </div>
                        ) : '***'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        {canView(k.g) ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 sm:w-24 bg-gray-700 rounded-full h-2"><div className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full" style={{ width: `${k.p}%` }} /></div>
                            <span className="text-yellow-300 font-semibold text-xs sm:text-sm">{Math.round(k.p)}%</span>
                          </div>
                        ) : '***'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-green-400 font-bold text-sm sm:text-base">{canView(k.g) ? `₩${k.cpc.toLocaleString()}` : '***'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!load && !kws.length && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 sm:p-12 text-center">
            <TrendingUp className="mx-auto mb-4 text-purple-400" size={48} />
            <p className="text-white text-lg sm:text-xl">분석 시작</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordAnalyzer;
