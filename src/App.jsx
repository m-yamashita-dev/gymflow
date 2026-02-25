import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════ CONSTANTS ═══════════════════════════ */

const DAYS_JA = ["月","火","水","木","金","土","日"];
const A = "#e8ff00";

const RECOVERY_SCHEDULES = {
  1: {
    days: [2],
    reason: "水曜日がおすすめ。週の中盤で前後に休息日を自然に確保でき、生活リズムに溶け込みやすいです。"
  },
  2: {
    days: [0, 3],
    reason: "月・木の組み合わせ。各セッション間に72時間の回復期間を確保でき、筋肉が十分に修復されてから再刺激できます。"
  },
  3: {
    days: [0, 2, 4],
    reason: "月・水・金のPPLスタンダード。48〜72時間の回復期間が各部位に生まれる、週3回で最も効率的な配置です。"
  },
  4: {
    days: [0, 1, 3, 4],
    reason: "月火・木金の上下分割。週を前半・後半に分けることで同部位への連続刺激を避け、疲労の蓄積を防ぎます。"
  },
  5: {
    days: [0, 1, 2, 3, 4],
    reason: "月〜金の5連続。土日に完全休養を取ることで、週明けに万全のコンディションで再スタートできます。"
  },
  6: {
    days: [0, 1, 2, 3, 4, 5],
    reason: "月〜土のフル稼働。PPL×2が前提で各部位に最低48時間の回復を確保。日曜の完全休養が必須です。"
  },
};

const PROGRAMS = {
  1: { name: "全身法（週1回）", days: [
    { label: "全身", icon: "⚡", exIds: ["bench_press","lat_pulldown","squat","ohp","barbell_curl","tricep_pushdown","plank"] }
  ]},
  2: { name: "上下分割（週2回）", days: [
    { label: "上半身",  icon: "💪", exIds: ["bench_press","lat_pulldown","ohp","barbell_curl","tricep_pushdown"] },
    { label: "下半身",  icon: "🦵", exIds: ["squat","leg_press","leg_curl","calf_raise","plank"] },
  ]},
  3: { name: "PPL分割（週3回）", days: [
    { label: "Push — 胸・肩・三頭", icon: "🫸", exIds: ["bench_press","incline_press","ohp","lateral_raise","tricep_pushdown"] },
    { label: "Pull — 背中・二頭",   icon: "🫷", exIds: ["deadlift","lat_pulldown","seated_row","face_pull","barbell_curl"] },
    { label: "Legs — 脚・腹",       icon: "🦵", exIds: ["squat","leg_press","leg_curl","leg_extension","calf_raise","plank"] },
  ]},
  4: { name: "上下分割（週4回）", days: [
    { label: "上半身A — 胸・三頭",   icon: "💪", exIds: ["bench_press","incline_press","cable_fly","tricep_pushdown","dips"] },
    { label: "下半身A",              icon: "🦵", exIds: ["squat","leg_press","leg_extension","calf_raise"] },
    { label: "上半身B — 背中・二頭", icon: "🔥", exIds: ["deadlift","lat_pulldown","seated_row","barbell_curl","hammer_curl"] },
    { label: "下半身B＋肩",          icon: "⚡", exIds: ["rdl","leg_curl","ohp","lateral_raise","face_pull","plank"] },
  ]},
  5: { name: "PPL+上下（週5回）", days: [
    { label: "Push — 胸・肩・三頭", icon: "🫸", exIds: ["bench_press","incline_press","ohp","lateral_raise","tricep_pushdown","overhead_ext"] },
    { label: "Pull — 背中・二頭",   icon: "🫷", exIds: ["deadlift","lat_pulldown","seated_row","face_pull","barbell_curl","hammer_curl"] },
    { label: "Legs — 脚",           icon: "🦵", exIds: ["squat","leg_press","leg_extension","leg_curl","calf_raise"] },
    { label: "上半身（仕上げ）",     icon: "💪", exIds: ["db_press","cable_fly","db_shoulder_press","db_curl","dips","plank"] },
    { label: "下半身＋腹（仕上げ）", icon: "⚡", exIds: ["rdl","goblet_squat","leg_curl","calf_raise","cable_crunch","plank"] },
  ]},
  6: { name: "PPL×2（週6回）", days: [
    { label: "Push 1 — 重量重視",   icon: "🫸", exIds: ["bench_press","ohp","incline_press","lateral_raise","tricep_pushdown"] },
    { label: "Pull 1 — 重量重視",   icon: "🫷", exIds: ["deadlift","lat_pulldown","seated_row","face_pull","barbell_curl"] },
    { label: "Legs 1 — 重量重視",   icon: "🦵", exIds: ["squat","leg_press","rdl","calf_raise","plank"] },
    { label: "Push 2 — ボリューム", icon: "🔥", exIds: ["db_press","cable_fly","db_shoulder_press","lateral_raise","dips","overhead_ext"] },
    { label: "Pull 2 — ボリューム", icon: "💪", exIds: ["lat_pulldown","seated_row","face_pull","db_curl","hammer_curl"] },
    { label: "Legs 2 — ボリューム", icon: "⚡", exIds: ["goblet_squat","leg_extension","leg_curl","calf_raise","cable_crunch","plank"] },
  ]},
};

const EX_DB = {
  bench_press:      { name:"バーベルベンチプレス",         lv:2, muscle:"大胸筋・三頭筋・前三角筋",     sets:4, reps:"8〜10",  alt:["db_press","push_up"],         tip:"肩甲骨を寄せて胸を張り、バーをみぞおちに向けて下ろす",              yt:"ベンチプレス+フォーム+初心者" },
  incline_press:    { name:"インクラインプレス",            lv:2, muscle:"大胸筋（上部）",               sets:3, reps:"8〜10",  alt:["db_press"],                   tip:"30〜45度の角度で行い、上部大胸筋を意識する",                        yt:"インクラインベンチプレス+フォーム" },
  db_press:         { name:"ダンベルプレス",               lv:1, muscle:"大胸筋・三頭筋",               sets:3, reps:"10〜12", alt:["push_up"],                    tip:"ダンベルを胸の横まで下ろし、弧を描くように押し上げる",               yt:"ダンベルプレス+フォーム" },
  cable_fly:        { name:"ケーブルフライ",               lv:2, muscle:"大胸筋（内側）",               sets:3, reps:"12〜15", alt:["db_fly"],                     tip:"腕を抱きしめるイメージで、胸の前で手を合わせる",                    yt:"ケーブルフライ+フォーム" },
  db_fly:           { name:"ダンベルフライ",               lv:1, muscle:"大胸筋",                     sets:3, reps:"12",     alt:["cable_fly"],                  tip:"肘を少し曲げたまま大きく広げ、胸を使って閉じる",                    yt:"ダンベルフライ+フォーム" },
  push_up:          { name:"プッシュアップ",               lv:1, muscle:"大胸筋・三頭筋",               sets:3, reps:"15〜20", alt:[],                             tip:"体を一直線に保ち、胸がギリギリ床につく高さまで下ろす",               yt:"プッシュアップ+正しいフォーム" },
  deadlift:         { name:"デッドリフト",                 lv:3, muscle:"脊柱起立筋・ハムスト・広背筋", sets:4, reps:"5〜8",   alt:["rdl","seated_row"],           tip:"背中を丸めず、バーを体に沿って引き上げる",                          yt:"デッドリフト+フォーム+初心者" },
  lat_pulldown:     { name:"ラットプルダウン",             lv:1, muscle:"広背筋・二頭筋",               sets:4, reps:"10〜12", alt:["seated_row"],                 tip:"胸を張り、バーを鎖骨に向けて引き下ろす",                            yt:"ラットプルダウン+フォーム" },
  seated_row:       { name:"シーテッドロウ",               lv:1, muscle:"広背筋・僧帽筋・菱形筋",       sets:3, reps:"10〜12", alt:["lat_pulldown"],               tip:"肘を脇に沿って引き、肩甲骨を中央に寄せる",                          yt:"シーテッドロウ+フォーム" },
  rdl:              { name:"ルーマニアンデッドリフト",      lv:2, muscle:"ハムスト・臀筋・広背筋",       sets:3, reps:"10〜12", alt:["back_extension"],             tip:"膝をほぼ伸ばしたまま、ハムストリングが伸びる感覚を意識",             yt:"ルーマニアンデッドリフト+フォーム" },
  back_extension:   { name:"バックエクステンション",        lv:1, muscle:"脊柱起立筋",                  sets:3, reps:"15",     alt:[],                             tip:"腰を過度に反らさず、背中の力で上体を持ち上げる",                    yt:"バックエクステンション+フォーム" },
  face_pull:        { name:"フェイスプル",                 lv:1, muscle:"後部三角筋・僧帽筋",           sets:3, reps:"12〜15", alt:[],                             tip:"顔の方向にロープを引き、肘を肩より高く保つ",                        yt:"フェイスプル+フォーム" },
  squat:            { name:"バーベルスクワット",           lv:3, muscle:"大腿四頭筋・臀筋・ハムスト",   sets:4, reps:"8〜10",  alt:["goblet_squat","leg_press"],    tip:"膝をつま先と同じ方向に向け、股関節と膝を同時に曲げる",               yt:"バーベルスクワット+フォーム+初心者" },
  leg_press:        { name:"レッグプレス",                 lv:1, muscle:"大腿四頭筋・臀筋",             sets:4, reps:"10〜12", alt:["goblet_squat"],               tip:"腰をシートに密着させたまま、ゆっくり膝を曲げる",                    yt:"レッグプレス+フォーム" },
  goblet_squat:     { name:"ゴブレットスクワット",          lv:1, muscle:"大腿四頭筋・臀筋",             sets:3, reps:"12〜15", alt:[],                             tip:"胸の前でダンベルを抱え、上体を立てたまましゃがむ",                   yt:"ゴブレットスクワット+フォーム" },
  leg_curl:         { name:"レッグカール",                 lv:1, muscle:"ハムストリング",               sets:3, reps:"10〜12", alt:["rdl"],                        tip:"勢いをつけず、ゆっくりとハムストリングを収縮させる",                 yt:"レッグカール+フォーム" },
  leg_extension:    { name:"レッグエクステンション",        lv:1, muscle:"大腿四頭筋",                  sets:3, reps:"12〜15", alt:[],                             tip:"膝が完全に伸びたところで一瞬止め、大腿四頭筋を意識",                 yt:"レッグエクステンション+フォーム" },
  calf_raise:       { name:"カーフレイズ",                 lv:1, muscle:"下腿三頭筋（ふくらはぎ）",     sets:3, reps:"15〜20", alt:[],                             tip:"つま先立ちで最上部まで上げ、ゆっくり下ろす",                        yt:"カーフレイズ+フォーム" },
  ohp:              { name:"オーバーヘッドプレス",          lv:2, muscle:"三角筋全体・三頭筋",           sets:4, reps:"8〜10",  alt:["db_shoulder_press"],          tip:"腰を反らさず、バーを顎の前から頭上へ押し上げる",                    yt:"オーバーヘッドプレス+フォーム" },
  db_shoulder_press:{ name:"ダンベルショルダープレス",      lv:1, muscle:"三角筋・三頭筋",               sets:3, reps:"10〜12", alt:[],                             tip:"耳の横でダンベルを持ち、真上に押し上げる",                          yt:"ダンベルショルダープレス+フォーム" },
  lateral_raise:    { name:"サイドレイズ",                 lv:1, muscle:"三角筋（外側）",               sets:3, reps:"12〜15", alt:[],                             tip:"肘を少し曲げ、小指側を高くするイメージで真横に上げる",               yt:"サイドレイズ+フォーム" },
  barbell_curl:     { name:"バーベルカール",               lv:1, muscle:"上腕二頭筋",                  sets:3, reps:"10〜12", alt:["db_curl"],                    tip:"肘を固定したまま、前腕だけを動かす",                                yt:"バーベルカール+フォーム" },
  db_curl:          { name:"ダンベルカール",               lv:1, muscle:"上腕二頭筋",                  sets:3, reps:"10〜12", alt:[],                              tip:"小指側を上に向けるよう手首を回しながら上げる",                      yt:"ダンベルカール+フォーム" },
  hammer_curl:      { name:"ハンマーカール",               lv:1, muscle:"上腕筋・腕橈骨筋",             sets:3, reps:"10〜12", alt:[],                             tip:"親指を上に向けたまま（ハンマー握り）でカールする",                   yt:"ハンマーカール+フォーム" },
  tricep_pushdown:  { name:"トライセップスプッシュダウン",  lv:1, muscle:"上腕三頭筋",                  sets:3, reps:"12〜15", alt:["overhead_ext"],               tip:"肘を体の横で固定し、前腕だけを押し下げる",                          yt:"トライセップスプッシュダウン+フォーム" },
  overhead_ext:     { name:"オーバーヘッドエクステンション",lv:1, muscle:"上腕三頭筋（長頭）",           sets:3, reps:"10〜12", alt:[],                             tip:"肘を耳の横で固定し、ダンベルを頭の後ろに下ろして押し上げる",         yt:"オーバーヘッドエクステンション+フォーム" },
  dips:             { name:"ディップス",                   lv:2, muscle:"上腕三頭筋・大胸筋下部",       sets:3, reps:"8〜12",  alt:["tricep_pushdown"],            tip:"上体を少し前傾させ、肘が90度になるまで下ろす",                      yt:"ディップス+フォーム" },
  crunch:           { name:"クランチ",                     lv:1, muscle:"腹直筋",                     sets:3, reps:"15〜20", alt:[],                             tip:"首ではなく腹直筋の力で肩甲骨を床から持ち上げる",                    yt:"クランチ+正しいフォーム" },
  plank:            { name:"プランク",                     lv:1, muscle:"腹横筋・腹直筋",              sets:3, reps:"30〜60秒",alt:[],                            tip:"体を一直線に保ち、お腹を引き込んだまま呼吸を続ける",                yt:"プランク+フォーム" },
  cable_crunch:     { name:"ケーブルクランチ",             lv:2, muscle:"腹直筋",                     sets:3, reps:"12〜15", alt:["crunch"],                     tip:"股関節を曲げず、背中を丸めるように上体を引き下げる",                 yt:"ケーブルクランチ+フォーム" },
};

const LV_LABEL = ["","初心者","中級者","上級者"];
const LV_COLOR = ["","#22c55e","#f59e0b","#ef4444"];

const GOAL_PRESETS = {
  beginner:   { label:"初心者（フォーム習得）", vol:0.8, addRep:0 },
  hypertrophy:{ label:"筋肥大（ボリューム重視）", vol:1.35, addRep:1 },
  strength:   { label:"筋力（高重量重視）", vol:1.0, addRep:-1 },
  maintain:   { label:"維持（低疲労）", vol:0.7, addRep:0 },
};

const PHASE_WEEKS = [
  { type:"volume", label:"高ボリューム" },
  { type:"volume", label:"高ボリューム" },
  { type:"volume", label:"高ボリューム" },
  { type:"intensity", label:"高重量" },
  { type:"deload", label:"デロード" },
];

const PHASE_FACTOR = { volume:1.1, intensity:1.0, deload:0.6 };

/* ═══════════════════════════ STORAGE ═══════════════════════════ */
async function stGet(k) {
  try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function stSet(k, v) {
  try { await window.storage.set(k, JSON.stringify(v)); } catch {}
}

function weekStartKey(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function repMax(repText) {
  if (!repText) return null;
  const nums = (repText.match(/\d+/g) || []).map(Number);
  return nums.length ? Math.max(...nums) : null;
}

/* ═══════════════════════════ APP ═══════════════════════════ */
export default function App() {
  const [step, setStep]         = useState("select");   // select|suggest|edit|program|day|detail
  const [freq, setFreq]         = useState(null);
  const [assigned, setAssigned] = useState([]);          // confirmed weekday indices
  const [editing, setEditing]   = useState([]);          // temp editing state
  const [dayIdx, setDayIdx]     = useState(null);
  const [detailEx, setDetailEx] = useState(null);
  const [doneMap, setDoneMap]   = useState({});          // { "exId_setIdx": bool }
  const [inputMap, setInputMap] = useState({});          // { exId: { setIdx: { w, r } } }
  const [prs, setPrs]           = useState({});          // { exId: { w, r, date } }
  const [prReady, setPrReady]   = useState(false);
  const [newPrFlash, setNewPrFlash] = useState(null);   // exId of newly beaten PR
  const [restSeconds, setRestSeconds] = useState(90);
  const [restLeft, setRestLeft] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [exNotes, setExNotes]   = useState({});
  const [ioMsg, setIoMsg]       = useState("");
  const [goal, setGoal]         = useState("beginner");
  const [phaseWeek, setPhaseWeek] = useState(1);
  const [noPrStreak, setNoPrStreak] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      stGet("gf2:prs"),
      stGet("gf2:logs"),
      stGet("gf2:notes"),
      stGet("gf2:settings")
    ]).then(([prsData, logData, noteData, settingData]) => {
      if (prsData) setPrs(prsData);
      if (logData) setWorkoutLogs(logData);
      if (noteData) setExNotes(noteData);
      if (settingData?.restSeconds) setRestSeconds(settingData.restSeconds);
      if (settingData?.goal) setGoal(settingData.goal);
      if (settingData?.phaseWeek) setPhaseWeek(settingData.phaseWeek);
      if (settingData?.noPrStreak) setNoPrStreak(settingData.noPrStreak);
      setPrReady(true);
    });
  }, []);

  const prog  = freq ? PROGRAMS[freq]          : null;
  const sched = freq ? RECOVERY_SCHEDULES[freq]: null;
  const phaseInfo = PHASE_WEEKS[Math.max(0, Math.min(PHASE_WEEKS.length - 1, phaseWeek - 1))];
  const goalPreset = GOAL_PRESETS[goal] || GOAL_PRESETS.beginner;

  const calcTargetSets = useCallback((ex) => {
    if (!ex) return 0;
    const base = ex.sets || 0;
    const factor = (goalPreset.vol || 1) * (PHASE_FACTOR[phaseInfo.type] || 1);
    return Math.max(1, Math.round(base * factor));
  }, [goalPreset.vol, phaseInfo.type]);


  /* —— navigation —— */
  const goBack = () => {
    const m = { detail:"day", day:"program", program:"suggest", edit:"suggest", suggest:"select" };
    if (step === "detail") setDetailEx(null);
    setStep(m[step] || "select");
  };

  /* —— frequency selection —— */
  const pickFreq = n => {
    setFreq(n);
    setAssigned(RECOVERY_SCHEDULES[n].days);
    setStep("suggest");
  };

  /* —— schedule editing —— */
  const toggleEdit = i => {
    if (editing.includes(i)) {
      if (editing.length > 1) setEditing(p => p.filter(d => d !== i));
    } else {
      if (editing.length < freq) setEditing(p => [...p, i].sort((a,b)=>a-b));
    }
  };

  /* —— PR save —— */
  const savePr = useCallback(async (exId, w, r) => {
    const weight = parseFloat(w), reps = parseInt(r);
    if (!weight || !reps) return false;
    const cur = prs[exId];
    if (!cur || weight * reps > cur.w * cur.r) {
      const next = { ...prs, [exId]: { w: weight, r: reps, date: new Date().toLocaleDateString("ja-JP") } };
      setPrs(next);
      await stSet("gf2:prs", next);
      setNewPrFlash(exId);
      setTimeout(() => setNewPrFlash(null), 2500);
      return true;
    }
    return false;
  }, [prs]);

  /* —— set inputs —— */
  const getInp = (exId, si) => inputMap[exId]?.[si] || { w:"", r:"" };
  const setInp = (exId, si, field, val) =>
    setInputMap(p => ({ ...p, [exId]: { ...(p[exId]||{}), [si]: { ...(p[exId]?.[si]||{}), [field]: val } } }));

  const startRestTimer = useCallback(async () => {
    setRestLeft(restSeconds);
    await stSet("gf2:settings", { restSeconds });
  }, [restSeconds]);

  useEffect(() => {
    if (restLeft <= 0) return;
    const t = setInterval(() => setRestLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [restLeft]);

  useEffect(() => {
    if (restLeft !== 0) return;
    if (typeof window !== "undefined" && navigator.vibrate) navigator.vibrate([120, 80, 120]);
  }, [restLeft]);

  const toggleSet = async (exId, si) => {
    const key = `${exId}_${si}`, next = !doneMap[key];
    setDoneMap(p => ({ ...p, [key]: next }));
    if (next) {
      const i = getInp(exId, si);
      const improved = await savePr(exId, i.w, i.r);
      const nextStreak = {
        ...noPrStreak,
        [exId]: improved ? 0 : (noPrStreak[exId] || 0) + 1,
      };
      setNoPrStreak(nextStreak);
      await stSet("gf2:settings", { restSeconds, goal, phaseWeek, noPrStreak: nextStreak });
      await startRestTimer();
    }
  };

  useEffect(() => {
    if (step !== "day" || !prog || dayIdx === null) return;
    const dayData = prog.days[dayIdx];
    const total = dayData.exIds.reduce((a,id) => a + calcTargetSets(EX_DB[id]), 0);
    const done  = Object.values(doneMap).filter(Boolean).length;
    if (!done) return;
    const wk = weekStartKey();
    const today = todayKey();
    setWorkoutLogs(prev => {
      const prevWeek = prev[wk] || { sessions:0, setsDone:0, setsTotal:0, days:{} };
      const days = { ...(prevWeek.days || {}), [today]: true };
      const next = { ...prev, [wk]: { sessions: Object.keys(days).length, setsDone: done, setsTotal: total, days } };
      stSet("gf2:logs", next);
      return next;
    });
  }, [doneMap, step, dayIdx, prog, calcTargetSets]);

  const weekly = workoutLogs[weekStartKey()] || { sessions:0, setsDone:0, setsTotal:0, days:{} };
  const suggestDeload = phaseInfo.type !== "deload" && weekly.setsTotal > 0 && weekly.setsDone / weekly.setsTotal < 0.55;

  const suggestNext = (exId, ex) => {
    const pr = prs[exId];
    const streak = noPrStreak[exId] || 0;
    if (streak >= 6) return "停滞中: 代替種目への切替を推奨";
    if (!pr) return "次回目安: 記録後に表示";
    const maxRep = repMax(ex.reps);
    const repBias = goalPreset.addRep || 0;
    if (!maxRep || !pr.w) return `次回目安: ${Math.max(1, pr.r + 1 + repBias)}回`;
    if (phaseInfo.type === "deload") return `次回目安: ${Math.max(0, Number(pr.w) - 5)}kg × ${Math.max(5, pr.r - 2)}回`;
    if (pr.r >= maxRep + repBias) return `次回目安: ${Number(pr.w) + (goal === "strength" ? 2.5 : 1.25)}kg × ${Math.max(6, maxRep - 2)}回`;
    return `次回目安: ${pr.w}kg × ${Math.max(1, pr.r + 1 + repBias)}回`;
  };

  const exportData = () => {
    const payload = { prs, logs: workoutLogs, notes: exNotes, settings: { restSeconds, goal, phaseWeek, noPrStreak }, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gymflow-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (typeof json !== "object" || !json) throw new Error("invalid");
      if (json.prs && typeof json.prs === "object") { setPrs(json.prs); await stSet("gf2:prs", json.prs); }
      if (json.logs && typeof json.logs === "object") { setWorkoutLogs(json.logs); await stSet("gf2:logs", json.logs); }
      if (json.notes && typeof json.notes === "object") { setExNotes(json.notes); await stSet("gf2:notes", json.notes); }
      if (json.settings?.restSeconds) setRestSeconds(json.settings.restSeconds);
      if (json.settings?.goal) setGoal(json.settings.goal);
      if (json.settings?.phaseWeek) setPhaseWeek(json.settings.phaseWeek);
      if (json.settings?.noPrStreak) setNoPrStreak(json.settings.noPrStreak);
      if (json.settings) await stSet("gf2:settings", json.settings);
      setIoMsg("バックアップを復元しました");
    } catch {
      setIoMsg("バックアップの読み込みに失敗しました");
    } finally {
      e.target.value = "";
      setTimeout(() => setIoMsg(""), 2500);
    }
  };

  useEffect(() => {
    stSet("gf2:settings", { restSeconds, goal, phaseWeek, noPrStreak });
  }, [restSeconds, goal, phaseWeek, noPrStreak]);

  const advancePhaseWeek = () => setPhaseWeek(p => p >= PHASE_WEEKS.length ? 1 : p + 1);

  const finalizeSession = (done, total) => {
    const wk = weekStartKey();
    const today = todayKey();
    setWorkoutLogs(prev => {
      const prevWeek = prev[wk] || { sessions:0, setsDone:0, setsTotal:0, days:{}, sessionsMeta:{} };
      const days = { ...(prevWeek.days || {}), [today]: true };
      const sessionsMeta = {
        ...(prevWeek.sessionsMeta || {}),
        [today]: {
          done,
          total,
          completed: done >= total,
          finishedAt: new Date().toLocaleString("ja-JP"),
        }
      };
      const next = {
        ...prev,
        [wk]: {
          ...prevWeek,
          sessions: Object.keys(days).length,
          setsDone: Math.max(done, prevWeek.setsDone || 0),
          setsTotal: Math.max(total, prevWeek.setsTotal || 0),
          days,
          sessionsMeta,
        }
      };
      stSet("gf2:logs", next);
      return next;
    });
    setRestLeft(0);
    setDoneMap({});
    setInputMap({});
    setDayIdx(null);
    setStep("program");
  };

  /* —— progress —— */
  const calcProg = dayData => {
    const total = dayData.exIds.reduce((a,id) => a + calcTargetSets(EX_DB[id]), 0);
    const done  = Object.values(doneMap).filter(Boolean).length;
    return { done, total, pct: total ? Math.round(done/total*100) : 0 };
  };

  /* ═══ RENDER HELPERS ═══ */
  const Tag = ({ c, children }) => (
    <span style={{ fontSize:10, padding:"2px 9px", borderRadius:20, background:"#1a1a1a", color:c||"#555", fontFamily:"sans-serif", border:`1px solid ${(c||"#555")}33`, display:"inline-block" }}>
      {children}
    </span>
  );

  const Card = ({ children, style: s={} }) => (
    <div style={{ background:"#111", border:"1px solid #1d1d1d", borderRadius:14, padding:"15px 17px", ...s }}>
      {children}
    </div>
  );

  const Label = ({ children }) => (
    <div style={{ fontSize:10, color:"#444", letterSpacing:"0.25em", fontFamily:"sans-serif", marginBottom:8 }}>{children}</div>
  );

  /* ═══════════════ STEPS ═══════════════ */
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", color:"#f0f0ea", fontFamily:"'Bebas Neue','Oswald',sans-serif", letterSpacing:"0.02em" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu 0.25s ease forwards}
        .p:active{opacity:.7;transform:scale(.97)}
        .hov:hover{border-color:${A}!important;transition:border-color 0.15s}
        input[type=number]{-moz-appearance:textfield}
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none}
        @keyframes flash{0%,100%{background:#0f1a00}50%{background:#1a2f00}}
        .pr-flash{animation:flash 0.6s ease 2}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ height:50, borderBottom:"1px solid #161616", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px", position:"sticky", top:0, background:"#0a0a0a", zIndex:99 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:A, fontSize:16 }}>◆</span>
          <span style={{ fontSize:18, fontWeight:700, letterSpacing:"0.2em" }}>GYMFLOW</span>
        </div>
        {step !== "select" && (
          <button className="p" onClick={goBack} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontFamily:"inherit", fontSize:12, letterSpacing:"0.1em" }}>← 戻る</button>
        )}
      </div>

      <div style={{ maxWidth:460, margin:"0 auto", padding:"0 15px 80px" }}>

      {/* ══════ STEP 1: 頻度選択 ══════ */}
      {step === "select" && (
        <div className="fu">
          <div style={{ padding:"36px 0 24px", textAlign:"center" }}>
            <div style={{ fontSize:10, color:A, letterSpacing:"0.35em", marginBottom:10 }}>STEP 01 / 03</div>
            <h1 style={{ fontSize:36, fontWeight:700, lineHeight:1.1 }}>週に何回<br/>ジムに行ける？</h1>
            <p style={{ color:"#555", fontSize:13, fontFamily:"sans-serif", marginTop:10, lineHeight:1.7 }}>
              日数に合わせた最適な分割法と、筋肉回復を考慮したスケジュールを提案します
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[1,2,3,4,5,6].map(n => (
              <button key={n} className="p hov" onClick={() => pickFreq(n)} style={{
                background:"#111", border:"1px solid #1e1e1e", borderRadius:14,
                padding:"22px 0", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2
              }}>
                <span style={{ fontSize:40, color:A, fontWeight:700, lineHeight:1 }}>{n}</span>
                <span style={{ fontSize:10, color:"#444", fontFamily:"sans-serif", letterSpacing:"0.1em" }}>回 / 週</span>
              </button>
            ))}
          </div>
          <Card style={{ marginTop:28 }}>
            <Label>分割法の目安</Label>
            {[["1回","全身法"],["2回","上下分割"],["3回","PPL分割"],["4回","上下分割×2"],["5〜6回","PPL×2"]].map(([d,m]) => (
              <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #1a1a1a", fontFamily:"sans-serif", fontSize:13 }}>
                <span style={{ color:"#555" }}>{d}</span><span style={{ color:"#ccc" }}>{m}</span>
              </div>
            ))}
          </Card>

          <Card style={{ marginTop:12 }}>
            <Label>年間プラン設定（無料）</Label>
            <div style={{ fontFamily:"sans-serif", fontSize:12, color:"#888", marginBottom:8 }}>目的とフェーズでセット数を自動調整します</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:8 }}>
              {Object.entries(GOAL_PRESETS).map(([k, v]) => (
                <button key={k} className="p" onClick={() => setGoal(k)} style={{
                  textAlign:"left", padding:"8px 10px", borderRadius:10,
                  border:`1px solid ${goal === k ? A : "#252525"}`,
                  background: goal === k ? "#121b00" : "#111",
                  color: goal === k ? A : "#aaa", cursor:"pointer", fontFamily:"sans-serif", fontSize:12
                }}>{v.label}</button>
              ))}
            </div>
            <div style={{ marginTop:10, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <div style={{ fontFamily:"sans-serif", fontSize:12, color:"#777" }}>現在: Week {phaseWeek} / {PHASE_WEEKS.length} ({phaseInfo.label})</div>
              <button className="p" onClick={advancePhaseWeek} style={{ background:A, color:"#000", border:"none", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontWeight:700 }}>次の週へ</button>
            </div>
            {suggestDeload && <div style={{ marginTop:9, fontFamily:"sans-serif", fontSize:12, color:"#fbbf24" }}>達成率が低下しています。次週はデロード推奨です。</div>}
          </Card>

          <Card style={{ marginTop:12 }}>
            <Label>今週のダッシュボード</Label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              <div style={{ background:"#0f0f0f", border:"1px solid #1d1d1d", borderRadius:10, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#555", fontFamily:"sans-serif" }}>実施日数</div>
                <div style={{ fontSize:24, color:A }}>{weekly.sessions}</div>
              </div>
              <div style={{ background:"#0f0f0f", border:"1px solid #1d1d1d", borderRadius:10, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#555", fontFamily:"sans-serif" }}>完了セット</div>
                <div style={{ fontSize:24, color:A }}>{weekly.setsDone}</div>
              </div>
              <div style={{ background:"#0f0f0f", border:"1px solid #1d1d1d", borderRadius:10, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#555", fontFamily:"sans-serif" }}>達成率</div>
                <div style={{ fontSize:24, color:A }}>{weekly.setsTotal ? Math.round(weekly.setsDone / weekly.setsTotal * 100) : 0}%</div>
              </div>
            </div>
          </Card>

          <Card style={{ marginTop:12 }}>
            <Label>バックアップ</Label>
            <div style={{ display:"flex", gap:8 }}>
              <button className="p" onClick={exportData} style={{ flex:1, background:A, border:"none", borderRadius:10, padding:"10px", color:"#000", fontWeight:700, cursor:"pointer" }}>JSONを書き出し</button>
              <button className="p" onClick={() => fileInputRef.current?.click()} style={{ flex:1, background:"#171717", border:"1px solid #242424", borderRadius:10, padding:"10px", color:"#aaa", cursor:"pointer" }}>JSONを読み込み</button>
            </div>
            {ioMsg && <div style={{ marginTop:8, fontFamily:"sans-serif", color:"#888", fontSize:12 }}>{ioMsg}</div>}
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportData} style={{ display:"none" }} />
          </Card>
        </div>
      )}

      {/* ══════ STEP 2a: スケジュール提案 ══════ */}
      {step === "suggest" && sched && prog && (
        <div className="fu">
          <div style={{ padding:"30px 0 18px" }}>
            <div style={{ fontSize:10, color:A, letterSpacing:"0.35em", marginBottom:8 }}>STEP 02 / 03 — スケジュール提案</div>
            <h2 style={{ fontSize:28, fontWeight:700, lineHeight:1.2 }}>最適な曜日を<br/>提案します</h2>
          </div>

          {/* 週カレンダー */}
          <Card style={{ marginBottom:12 }}>
            <Label>🧠 筋肉回復を考慮したおすすめ</Label>
            <div style={{ display:"flex", gap:5, marginBottom:16 }}>
              {DAYS_JA.map((d,i) => {
                const on = sched.days.includes(i);
                return (
                  <div key={i} style={{
                    flex:1, borderRadius:9, padding:"9px 2px", textAlign:"center",
                    background: on ? A : "#0f0f0f",
                    border:`1px solid ${on ? A : "#1a1a1a"}`
                  }}>
                    <div style={{ fontSize:13, fontWeight:700, color: on ? "#000" : "#2a2a2a" }}>{d}</div>
                    {on && <div style={{ fontSize:9, color:"#00000088", fontFamily:"sans-serif", marginTop:1 }}>GYM</div>}
                  </div>
                );
              })}
            </div>

            {/* プログラム×曜日マッピング */}
            {prog.days.map((day, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1a1a1a" }}>
                <span style={{ fontSize:18, width:24, textAlign:"center" }}>{day.icon}</span>
                <div style={{ flex:1, fontFamily:"sans-serif", fontSize:13, color:"#ccc" }}>{day.label}</div>
                <div style={{ background:A, color:"#000", borderRadius:7, padding:"3px 10px", fontSize:13, fontWeight:700, minWidth:28, textAlign:"center" }}>
                  {DAYS_JA[assigned[i]] ?? "—"}
                </div>
              </div>
            ))}
          </Card>

          {/* 理由 */}
          <Card style={{ marginBottom:20 }}>
            <Label>提案の理由</Label>
            <p style={{ fontFamily:"sans-serif", fontSize:13, color:"#aaa", lineHeight:1.8 }}>{sched.reason}</p>
          </Card>

          <button className="p" onClick={() => setStep("program")} style={{
            width:"100%", background:A, border:"none", borderRadius:12, padding:"15px",
            fontSize:17, fontFamily:"inherit", fontWeight:700, color:"#000", cursor:"pointer", letterSpacing:"0.1em", marginBottom:10
          }}>このスケジュールで決定 →</button>
          <button className="p" onClick={() => { setEditing([...assigned]); setStep("edit"); }} style={{
            width:"100%", background:"transparent", border:"1px solid #252525", borderRadius:12, padding:"13px",
            fontSize:15, fontFamily:"inherit", color:"#777", cursor:"pointer", letterSpacing:"0.1em"
          }}>✏️ 曜日を自分で編集する</button>
        </div>
      )}

      {/* ══════ STEP 2b: 曜日編集 ══════ */}
      {step === "edit" && prog && (
        <div className="fu">
          <div style={{ padding:"30px 0 18px" }}>
            <div style={{ fontSize:10, color:A, letterSpacing:"0.35em", marginBottom:8 }}>SCHEDULE EDITOR</div>
            <h2 style={{ fontSize:28, fontWeight:700, lineHeight:1.2 }}>曜日を<br/>カスタマイズ</h2>
            <p style={{ fontFamily:"sans-serif", fontSize:12, color:"#555", marginTop:8 }}>
              {freq}日選んでください（現在 {editing.length} / {freq}）
            </p>
          </div>

          {/* 曜日ボタン */}
          <div style={{ display:"flex", gap:6, marginBottom:22 }}>
            {DAYS_JA.map((d,i) => {
              const sel = editing.includes(i);
              const full = !sel && editing.length >= freq;
              return (
                <button key={i} className="p" onClick={() => toggleEdit(i)} disabled={full} style={{
                  flex:1, height:50, borderRadius:9, border:`2px solid ${sel ? A : "#1e1e1e"}`,
                  background: sel ? A : "#111",
                  color: sel ? "#000" : full ? "#222" : "#666",
                  fontSize:14, fontFamily:"inherit", fontWeight:700,
                  cursor: full ? "not-allowed" : "pointer", transition:"all 0.15s"
                }}>{d}</button>
              );
            })}
          </div>

          {/* プレビュー */}
          <Card style={{ marginBottom:20 }}>
            <Label>割り当てプレビュー</Label>
            {prog.days.map((day,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1a1a1a" }}>
                <span style={{ fontSize:18, width:24, textAlign:"center" }}>{day.icon}</span>
                <div style={{ flex:1, fontFamily:"sans-serif", fontSize:13, color:"#ccc" }}>{day.label}</div>
                <div style={{
                  background: editing[i] !== undefined ? A : "#1a1a1a",
                  color: editing[i] !== undefined ? "#000" : "#333",
                  borderRadius:7, padding:"3px 10px", fontSize:13, fontWeight:700, minWidth:28, textAlign:"center"
                }}>
                  {editing[i] !== undefined ? DAYS_JA[editing[i]] : "—"}
                </div>
              </div>
            ))}
          </Card>

          <button className="p" disabled={editing.length !== freq} onClick={() => { setAssigned([...editing]); setStep("program"); }} style={{
            width:"100%", borderRadius:12, border:"none", padding:"15px",
            background: editing.length === freq ? A : "#1a1a1a",
            color: editing.length === freq ? "#000" : "#333",
            fontSize:17, fontFamily:"inherit", fontWeight:700,
            cursor: editing.length === freq ? "pointer" : "not-allowed", letterSpacing:"0.1em"
          }}>
            {editing.length === freq ? "このスケジュールで決定 →" : `あと ${freq - editing.length} 日選んでください`}
          </button>
        </div>
      )}

      {/* ══════ STEP 3: プログラム一覧 ══════ */}
      {step === "program" && prog && (
        <div className="fu">
          <div style={{ padding:"26px 0 14px" }}>
            <div style={{ fontSize:10, color:A, letterSpacing:"0.35em", marginBottom:6 }}>YOUR PROGRAM</div>
            <h2 style={{ fontSize:24, fontWeight:700 }}>{prog.name}</h2>
            <button onClick={() => setStep("suggest")} style={{
              background:"none", border:"none", color:"#555", fontFamily:"sans-serif", fontSize:12,
              cursor:"pointer", textDecoration:"underline", marginTop:5, padding:0
            }}>✏️ スケジュールを変更する</button>
          </div>

          {/* 週カレンダー */}
          <div style={{ display:"flex", gap:5, marginBottom:18 }}>
            {DAYS_JA.map((d,i) => {
              const ai = assigned.indexOf(i);
              const on = ai !== -1;
              return (
                <div key={i} style={{
                  flex:1, borderRadius:9, padding:"8px 2px", textAlign:"center",
                  background: on ? A : "#0f0f0f",
                  border:`1px solid ${on ? A : "#1a1a1a"}`
                }}>
                  <div style={{ fontSize:13, fontWeight:700, color: on ? "#000" : "#252525" }}>{d}</div>
                  {on && <div style={{ fontSize:12, marginTop:1 }}>{prog.days[ai]?.icon}</div>}
                </div>
              );
            })}
          </div>

          {prog.days.map((day,i) => (
            <button key={i} className="p hov" onClick={() => { setDayIdx(i); setDoneMap({}); setInputMap({}); setStep("day"); }} style={{
              width:"100%", background:"#111", border:"1px solid #1d1d1d", borderRadius:14,
              padding:"15px 17px", cursor:"pointer", textAlign:"left",
              display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:26 }}>{day.icon}</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#f0f0ea", letterSpacing:"0.05em" }}>{day.label}</div>
                  <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center" }}>
                    <span style={{ fontFamily:"sans-serif", fontSize:11, color:"#444" }}>{day.exIds.length} 種目</span>
                    <span style={{ color:"#2a2a2a" }}>·</span>
                    <span style={{ fontFamily:"sans-serif", fontSize:11, color:A+"bb" }}>
                      {assigned[i] !== undefined ? DAYS_JA[assigned[i]]+"曜日" : "未設定"}
                    </span>
                  </div>
                </div>
              </div>
              <span style={{ color:A, fontSize:16 }}>→</span>
            </button>
          ))}
        </div>
      )}

      {/* ══════ STEP 4: トレーニング日 ══════ */}
      {step === "day" && prog && dayIdx !== null && (() => {
        const dayData = prog.days[dayIdx];
        const { done, total, pct } = calcProg(dayData);
        return (
          <div className="fu">
            {/* ヘッダー */}
            <div style={{ padding:"22px 0 14px", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:28 }}>{dayData.icon}</span>
              <div>
                <div style={{ fontSize:10, color:A, letterSpacing:"0.2em", marginBottom:2 }}>
                  {assigned[dayIdx] !== undefined ? DAYS_JA[assigned[dayIdx]]+"曜日" : ""}
                </div>
                <h2 style={{ fontSize:18, fontWeight:700 }}>{dayData.label}</h2>
              </div>
            </div>

            {/* 進捗バー */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"sans-serif", fontSize:11, color:"#555", marginBottom:5 }}>
                <span>進捗</span>
                <span style={{ color: pct===100 ? A : "#666" }}>{done} / {total} セット {pct===100 ? "✓" : ""}</span>
              </div>
              <div style={{ height:4, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:A, borderRadius:2, transition:"width 0.4s ease" }}/>
              </div>
            </div>

            <Card style={{ marginBottom:12 }}>
              <Label>REST TIMER</Label>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                <div style={{ fontSize:28, color: restLeft > 0 ? A : "#666" }}>{restLeft > 0 ? `${Math.floor(restLeft/60)}:${String(restLeft%60).padStart(2,"0")}` : "READY"}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[60,90,120].map(sec => (
                    <button key={sec} className="p" onClick={() => setRestSeconds(sec)} style={{ background: restSeconds===sec ? A : "#1a1a1a", color: restSeconds===sec ? "#000" : "#666", border:"none", borderRadius:7, padding:"6px 9px", cursor:"pointer", fontSize:11 }}>{sec}s</button>
                  ))}
                </div>
              </div>
            </Card>

            {pct === 100 && (
              <div style={{ background:"#0f1a00", border:`1px solid ${A}44`, borderRadius:12, padding:"14px", marginBottom:14, textAlign:"center", fontFamily:"sans-serif", fontSize:14, color:A }}>
                🏆 トレーニング完了！お疲れさまでした！
              </div>
            )}

            <button className="p" onClick={() => finalizeSession(done, total)} style={{
              width:"100%", background: pct === 100 ? A : "#1f2830", border:"none", borderRadius:12,
              padding:"13px", color: pct === 100 ? "#000" : "#b5c7d6", cursor:"pointer",
              fontFamily:"inherit", fontWeight:700, letterSpacing:"0.08em", marginBottom:12
            }}>
              {pct === 100 ? "本日のトレーニングを完了する" : `今日はここまでで完了する（${done}/${total}セット）`}
            </button>

            {/* 種目リスト */}
            {dayData.exIds.map((exId, idx) => {
              const ex = EX_DB[exId];
              if (!ex) return null;
              const pr = prs[exId];
              const isNewPr = newPrFlash === exId;
              const targetSets = calcTargetSets(ex);
              const setsDone = Array.from({length:targetSets},(_,i)=>doneMap[`${exId}_${i}`]).filter(Boolean).length;
              const allDone = setsDone === targetSets;

              return (
                <div key={exId} style={{
                  background:"#0f0f0f", border:`1px solid ${allDone ? A : "#1a1a1a"}`,
                  borderRadius:14, marginBottom:10, overflow:"hidden", transition:"border-color 0.2s"
                }}>
                  {/* 種目ヘッダー */}
                  <div style={{ padding:"13px 15px 0" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:700, color: allDone ? A : "#f0f0ea", marginBottom:5 }}>
                          {idx+1}. {ex.name}
                        </div>
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                          <Tag c={LV_COLOR[ex.lv]}>{LV_LABEL[ex.lv]}</Tag>
                          <Tag>{targetSets}セット × {ex.reps}回</Tag>
                        </div>
                        <div style={{ marginTop:6, fontFamily:"sans-serif", fontSize:11, color:"#666" }}>
                          {suggestNext(exId, ex)}
                        </div>
                      </div>
                      <button className="p" onClick={() => { setDetailEx({ id:exId, ...ex }); setStep("detail"); }} style={{
                        background:"#1a1a1a", border:"1px solid #252525", borderRadius:8,
                        padding:"5px 11px", color:"#666", cursor:"pointer",
                        fontFamily:"inherit", fontSize:11, letterSpacing:"0.05em", flexShrink:0
                      }}>詳細</button>
                    </div>

                    {/* 前回PR */}
                    <div className={isNewPr ? "pr-flash" : ""} style={{
                      margin:"10px 0 2px", padding:"8px 10px", borderRadius:8,
                      background: pr ? (isNewPr ? "#0f1a00" : "#111") : "transparent",
                      border: pr ? `1px solid ${isNewPr ? A+"88" : "#1e1e1e"}` : "none"
                    }}>
                      {pr ? (
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                          <span style={{ fontSize:10, color:"#555", fontFamily:"sans-serif" }}>
                            {isNewPr ? "🎉 新記録！" : "前回PR："}
                          </span>
                          <span style={{ fontSize:15, color:A, fontFamily:"sans-serif", fontWeight:700 }}>
                            {pr.w}kg × {pr.r}回
                          </span>
                          <span style={{ fontSize:10, color:"#333", fontFamily:"sans-serif" }}>{pr.date}</span>
                        </div>
                      ) : prReady ? (
                        <span style={{ fontSize:11, color:"#333", fontFamily:"sans-serif" }}>まだ記録なし — 重量と回数を入力してセット完了を押すと保存されます</span>
                      ) : null}
                    </div>
                  </div>

                  {/* セット入力 */}
                  <div style={{ padding:"10px 15px 14px" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {Array.from({length:targetSets},(_,si) => {
                        const ip = getInp(exId, si);
                        const setDone = doneMap[`${exId}_${si}`];
                        return (
                          <div key={si} style={{
                            background: setDone ? "#0f1a00" : "#161616",
                            border:`1px solid ${setDone ? A+"66" : "#222"}`,
                            borderRadius:10, padding:"8px 9px", minWidth:76,
                            transition:"all 0.15s"
                          }}>
                            <div style={{ fontSize:10, color:"#3a3a3a", fontFamily:"sans-serif", textAlign:"center", marginBottom:6 }}>
                              Set {si+1}
                            </div>
                            {/* kg入力 */}
                            <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:5 }}>
                              <input
                                type="number" placeholder="kg" value={ip.w} disabled={setDone}
                                onChange={e => setInp(exId, si, "w", e.target.value)}
                                style={{
                                  width:42, background:"transparent", border:"none",
                                  borderBottom:`1px solid ${setDone ? A+"44" : "#2e2e2e"}`,
                                  color: setDone ? A : "#ddd", fontFamily:"sans-serif", fontSize:13,
                                  textAlign:"center", padding:"1px 0", outline:"none"
                                }}
                              />
                              <span style={{ fontSize:9, color:"#2e2e2e", fontFamily:"sans-serif" }}>kg</span>
                            </div>
                            {/* 回数入力 */}
                            <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:7 }}>
                              <input
                                type="number" placeholder="回" value={ip.r} disabled={setDone}
                                onChange={e => setInp(exId, si, "r", e.target.value)}
                                style={{
                                  width:42, background:"transparent", border:"none",
                                  borderBottom:`1px solid ${setDone ? A+"44" : "#2e2e2e"}`,
                                  color: setDone ? A : "#ddd", fontFamily:"sans-serif", fontSize:13,
                                  textAlign:"center", padding:"1px 0", outline:"none"
                                }}
                              />
                              <span style={{ fontSize:9, color:"#2e2e2e", fontFamily:"sans-serif" }}>回</span>
                            </div>
                            {/* 完了ボタン */}
                            <button className="p" onClick={() => toggleSet(exId, si)} style={{
                              width:"100%", borderRadius:6, border:"none",
                              background: setDone ? A : "#252525",
                              color: setDone ? "#000" : "#555",
                              fontFamily:"inherit", fontSize:11, fontWeight:700,
                              padding:"5px 0", cursor:"pointer", transition:"all 0.15s"
                            }}>
                              {setDone ? "✓ 完了" : "完了"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ══════ STEP 5: 種目詳細 ══════ */}
      {step === "detail" && detailEx && (
        <div className="fu">
          <div style={{ padding:"26px 0 14px" }}>
            <div style={{ fontSize:10, color:A, letterSpacing:"0.3em", marginBottom:8 }}>EXERCISE DETAIL</div>
            <h2 style={{ fontSize:28, fontWeight:700, lineHeight:1.2 }}>{detailEx.name}</h2>
          </div>

          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            <Tag c={LV_COLOR[detailEx.lv]}>{LV_LABEL[detailEx.lv]}</Tag>
            <Tag>{detailEx.muscle}</Tag>
          </div>

          {/* PR カード */}
          {prs[detailEx.id] ? (
            <div style={{
              background:"linear-gradient(135deg,#0f1a00,#111)",
              border:`1px solid ${A}55`, borderRadius:14, padding:"15px 17px", marginBottom:12
            }}>
              <Label>🏆 前回の最高記録 (PR)</Label>
              <div style={{ fontSize:30, color:A, fontWeight:700 }}>
                {prs[detailEx.id].w}kg × {prs[detailEx.id].r}回
              </div>
              <div style={{ fontFamily:"sans-serif", fontSize:11, color:"#555", marginTop:4 }}>{prs[detailEx.id].date}</div>
            </div>
          ) : (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontFamily:"sans-serif", fontSize:12, color:"#333" }}>まだ記録がありません。トレーニングを記録するとPRが表示されます。</div>
            </Card>
          )}

          {/* セット・レップ */}
          <Card style={{ marginBottom:12 }}>
            <Label>推奨セット・レップ数</Label>
            <div style={{ fontSize:22, color:A }}>{calcTargetSets(detailEx)}セット × {detailEx.reps}回</div>
          </Card>

          {/* フォームポイント */}
          <Card style={{ marginBottom:12 }}>
            <Label>フォームのポイント</Label>
            <p style={{ fontFamily:"sans-serif", fontSize:13, color:"#bbb", lineHeight:1.8 }}>{detailEx.tip}</p>
          </Card>

          <Card style={{ marginBottom:12 }}>
            <Label>トレーニングメモ</Label>
            <textarea
              value={exNotes[detailEx.id] || ""}
              onChange={e => {
                const next = { ...exNotes, [detailEx.id]: e.target.value };
                setExNotes(next);
                stSet("gf2:notes", next);
              }}
              placeholder="フォームの気づき・体調メモなど"
              style={{ width:"100%", minHeight:86, resize:"vertical", background:"#0f0f0f", color:"#ddd", border:"1px solid #252525", borderRadius:10, padding:"10px", fontFamily:"sans-serif", fontSize:13, outline:"none" }}
            />
          </Card>

          {/* YouTube */}
          <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(detailEx.yt)}`} target="_blank" rel="noopener noreferrer" style={{
            display:"flex", alignItems:"center", gap:14, background:"#111",
            border:"1px solid #1d1d1d", borderRadius:14, padding:"15px 17px",
            marginBottom:12, textDecoration:"none", color:"inherit"
          }}>
            <div style={{ width:38, height:38, borderRadius:9, background:"#ff0000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>▶</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>YouTubeで解説動画を見る</div>
              <div style={{ fontSize:11, color:"#555", fontFamily:"sans-serif" }}>フォームを動画で確認する</div>
            </div>
            <span style={{ color:"#333", marginLeft:"auto", fontSize:16 }}>↗</span>
          </a>

          {/* 代替種目 */}
          {detailEx.alt?.length > 0 && (
            <Card>
              <Label>難しい場合の代替種目</Label>
              {detailEx.alt.map(altId => {
                const alt = EX_DB[altId];
                if (!alt) return null;
                return (
                  <button key={altId} className="p hov" onClick={() => setDetailEx({ id:altId, ...alt })} style={{
                    width:"100%", background:"#0f0f0f", border:"1px solid #1e1e1e", borderRadius:10,
                    padding:"11px 14px", cursor:"pointer", textAlign:"left",
                    display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8
                  }}>
                    <div>
                      <div style={{ fontSize:14, color:"#eee", fontFamily:"inherit", marginBottom:3 }}>{alt.name}</div>
                      <div style={{ fontSize:11, color:"#444", fontFamily:"sans-serif" }}>{alt.sets}セット × {alt.reps}回</div>
                    </div>
                    <Tag c={LV_COLOR[alt.lv]}>{LV_LABEL[alt.lv]}</Tag>
                  </button>
                );
              })}
            </Card>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
