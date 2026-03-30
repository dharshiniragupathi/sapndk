import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiAlertTriangle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiHelpCircle,
  FiMessageSquare,
  FiMinus,
  FiPhone,
  FiSend,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import { clearAuthSession, getAuthToken } from "../../utils/authStorage";
import { MBBS_EXAM_STRUCTURE, MBBS_SUBJECT_TOTALS } from "../../data/mbbsDemoMarksSeed";
import "./StudentDashboard.css";

const defaultStudentProfile = {
  name: "Student",
  email: "",
  degree: "N/A",
  rollNo: "N/A",
  semester: null,
};

const exams = [
  "Internal 1",
  "Internal 2",
  "Midterm",
  "Final Exam",
];

const EXAM_DISPLAY_ORDER = {
  "Internal 1": 1,
  "Internal 2": 2,
  Midterm: 3,
  "Final Exam": 4,
};

const MBBS_SUBJECTS_BY_YEAR = {
  1: ["Anatomy", "Physiology", "Biochemistry"],
  2: ["Pathology", "Microbiology", "Forensic Medicine"],
  3: ["Community Medicine", "Ophthalmology", "ENT"],
  4: ["General Medicine", "General Surgery", "OBG"],
};

const MD_SUBJECTS_BY_YEAR = {
  1: ["Advanced Pathology", "Clinical Medicine", "Advanced Pharmacology", "Research Methodology", "Diagnostic Procedures"],
  2: ["Medical Ethics", "Critical Care", "Advanced Radiology", "Hospital Management", "Thesis Evaluation"],
};

const MD_SUBJECT_MAX_BY_NAME = {
  "Advanced Pathology": 200,
  "Clinical Medicine": 200,
  "Advanced Pharmacology": 150,
  "Research Methodology": 100,
  "Diagnostic Procedures": 150,
  "Medical Ethics": 100,
  "Critical Care": 200,
  "Advanced Radiology": 150,
  "Hospital Management": 100,
  "Thesis Evaluation": 200,
};

const MBBS_SUBJECT_MAX_BY_NAME = Object.values(MBBS_SUBJECT_TOTALS).reduce((acc, subject) => {
  acc[subject.name] = subject.maxMarks;
  return acc;
}, {});

const EXAM_MAX_BY_NAME = {
  "Internal 1": 50,
  "Internal 2": 50,
  Midterm: 75,
  "Final Exam": 100,
  ...MBBS_EXAM_STRUCTURE.reduce((acc, exam) => {
    acc[exam.name] = exam.maxMarks;
    return acc;
  }, {}),
};

const subjectCatalog = [
  { year: 1, name: "Anatomy", normalized: 82.5, raw: "68/80", classAvg: 65.2, classHighest: 91.4, percentile: 78, trend: "up" },
  { year: 1, name: "Physiology", normalized: 79.3, raw: "72/100", classAvg: 68.5, classHighest: 90.2, percentile: 72, trend: "up" },
  { year: 1, name: "Biochemistry", normalized: 67.8, raw: "58/75", classAvg: 51.8, classHighest: 86.1, percentile: 68, trend: "flat" },
  { year: 2, name: "Pathology", normalized: 88.7, raw: "82/100", classAvg: 72.3, classHighest: 95.3, percentile: 85, trend: "up" },
  { year: 2, name: "Microbiology", normalized: 75.2, raw: "61/75", classAvg: 56.9, classHighest: 89.7, percentile: 74, trend: "up" },
  { year: 2, name: "Forensic Medicine", normalized: 62.5, raw: "47/75", classAvg: 58.2, classHighest: 88.9, percentile: 55, trend: "down" },
  { year: 3, name: "Community Medicine", normalized: 70.1, raw: "53/75", classAvg: 60.7, classHighest: 89.4, percentile: 67, trend: "flat" },
  { year: 3, name: "Ophthalmology", normalized: 84.6, raw: "85/100", classAvg: 70.5, classHighest: 94.1, percentile: 82, trend: "up" },
  { year: 3, name: "ENT", normalized: 72.3, raw: "54/75", classAvg: 62.8, classHighest: 90.8, percentile: 70, trend: "flat" },
  { year: 4, name: "General Medicine", normalized: 88.4, raw: "88/100", classAvg: 74.3, classHighest: 96.1, percentile: 86, trend: "up" },
  { year: 4, name: "General Surgery", normalized: 79.8, raw: "60/75", classAvg: 68.7, classHighest: 92.4, percentile: 77, trend: "up" },
  { year: 4, name: "OBG", normalized: 66.2, raw: "50/75", classAvg: 57.6, classHighest: 87.2, percentile: 61, trend: "flat" },
];

const classNormalizedScoresByExam = {
  "Internal 1": [
    { studentName: "Aarav Mehta", normalizedScore: 89.8 },
    { studentName: "Neha Reddy", normalizedScore: 88.6 },
    { studentName: "Karan Iyer", normalizedScore: 87.9 },
    { studentName: "Ishita Singh", normalizedScore: 86.1 },
    { studentName: "Rohan Patel", normalizedScore: 85.4 },
    { studentName: "Ananya Verma", normalizedScore: 84.8 },
    { studentName: "Vikram Nair", normalizedScore: 83.9 },
    { studentName: "Meera Joshi", normalizedScore: 82.6 },
  ],
  "Internal 2": [
    { studentName: "Aarav Mehta", normalizedScore: 91.2 },
    { studentName: "Neha Reddy", normalizedScore: 90.4 },
    { studentName: "Karan Iyer", normalizedScore: 89.2 },
    { studentName: "Ishita Singh", normalizedScore: 88.6 },
    { studentName: "Rohan Patel", normalizedScore: 87.3 },
    { studentName: "Ananya Verma", normalizedScore: 86.5 },
    { studentName: "Vikram Nair", normalizedScore: 85.8 },
    { studentName: "Meera Joshi", normalizedScore: 84.2 },
  ],
  Midterm: [
    { studentName: "Aarav Mehta", normalizedScore: 93.4 },
    { studentName: "Neha Reddy", normalizedScore: 92.1 },
    { studentName: "Karan Iyer", normalizedScore: 91.5 },
    { studentName: "Ishita Singh", normalizedScore: 90.2 },
    { studentName: "Rohan Patel", normalizedScore: 89.4 },
    { studentName: "Ananya Verma", normalizedScore: 88.7 },
    { studentName: "Vikram Nair", normalizedScore: 87.3 },
    { studentName: "Meera Joshi", normalizedScore: 86.8 },
  ],
  "Final Exam": [
    { studentName: "Aarav Mehta", normalizedScore: 94.8 },
    { studentName: "Neha Reddy", normalizedScore: 93.6 },
    { studentName: "Karan Iyer", normalizedScore: 92.1 },
    { studentName: "Ishita Singh", normalizedScore: 90.9 },
    { studentName: "Rohan Patel", normalizedScore: 89.7 },
    { studentName: "Ananya Verma", normalizedScore: 88.4 },
    { studentName: "Vikram Nair", normalizedScore: 87.8 },
    { studentName: "Meera Joshi", normalizedScore: 86.9 },
  ],
};

const queriesSeed = [
  {
    id: 1,
    subject: "Pharmacology",
    status: "answered",
    to: "Dr. Emily Davis",
    date: "Feb 10, 2026",
    question: "Could you please clarify the mechanism of action for beta blockers?",
    response:
      "Beta blockers work by blocking the effects of epinephrine on beta-adrenergic receptors. This reduces heart rate, blood pressure, and cardiac output. Please review Chapter 12 for detailed mechanisms.",
  },
  {
    id: 2,
    subject: "OBG",
    status: "pending",
    to: "Dr. Jennifer Lee",
    date: "Feb 12, 2026",
    question: "Can you suggest a focused revision plan for labor management topics?",
    response: "",
  },
];

const mentorByYear = {
  1: {
    name: "Dr. Anitha S",
    role: "Professor of Anatomy",
    unit: "Pre-Clinical Sciences",
    email: "anitha@avp.bitsathy.ac.in",
    phone: "+91 98765 11001",
    nextMeeting: "Mar 12, 2026 at 11:00 AM",
    totalSessions: 6,
    sessions: [
      { id: 1, title: "Session 5 - Basics Consolidation", date: "Feb 8, 2026", status: "Completed" },
      { id: 2, title: "Session 6 - Anatomy & Physiology Review", date: "Mar 12, 2026", status: "Upcoming" },
    ],
  },
  2: {
    name: "Dr. Vignesh S",
    role: "Professor of Pathology",
    unit: "Para-Clinical Sciences",
    email: "vignesh@avp.bitsathy.ac.in",
    phone: "+91 98765 22002",
    nextMeeting: "Mar 14, 2026 at 2:30 PM",
    totalSessions: 7,
    sessions: [
      { id: 1, title: "Session 6 - Pharmacology Action Plan", date: "Feb 10, 2026", status: "Completed" },
      { id: 2, title: "Session 7 - Pathology Case Discussion", date: "Mar 14, 2026", status: "Upcoming" },
    ],
  },
  3: {
    name: "Dr. Natraj M",
    role: "Professor of General Medicine",
    unit: "Clinical Sciences",
    email: "natraj@avp.bitsathy.ac.in",
    phone: "+91 98765 33003",
    nextMeeting: "Mar 18, 2026 at 10:00 AM",
    totalSessions: 8,
    sessions: [
      { id: 1, title: "Session 7 - Clinical Case Review", date: "Feb 6, 2026", status: "Completed" },
      { id: 2, title: "Session 8 - Weak Area Reinforcement", date: "Mar 18, 2026", status: "Upcoming" },
    ],
  },
};

const recommendationMap = {
  Anatomy: [
    "Revise diagrams daily and practice labelled recall.",
    "Use short active-recall quizzes after each topic.",
    "Attend weekly anatomy viva drills with peers.",
  ],
  Physiology: [
    "Focus on flowcharts for core physiological pathways.",
    "Practice explanation-based answers for long questions.",
    "Reinforce high-yield formulas and graphs.",
  ],
  Biochemistry: [
    "Create pathway summary cards and revise cyclically.",
    "Practice clinical correlation questions.",
    "Spend 20 minutes daily on enzyme/regulation revision.",
  ],
  Pathology: [
    "Prioritize gross specimen and slide-based revision.",
    "Use pattern-based differential diagnosis tables.",
    "Practice concise pathology short notes.",
  ],
  Pharmacology: [
    "Create drug classification charts for daily revision.",
    "Focus on mechanism, adverse effects, and contraindications.",
    "Practice clinical prescription and case MCQs.",
  ],
  Microbiology: [
    "Revise organism-wise comparison tables.",
    "Practice sample case interpretation questions.",
    "Use spaced repetition for high-yield organisms.",
  ],
  "General Medicine": [
    "Work on symptom-to-diagnosis frameworks.",
    "Practice case sheet writing and viva style responses.",
    "Review management algorithms weekly.",
  ],
  "General Surgery": [
    "Strengthen instrument/procedure-based recall.",
    "Practice clinical scenario decision trees.",
    "Revise peri-operative principles and complications.",
  ],
  OBG: [
    "Attend focused labor ward and antenatal case discussions.",
    "Practice management flow for obstetric emergencies.",
    "Revise high-yield gynecology protocols and short notes.",
  ],
  "Community Medicine": [
    "Revise epidemiology formulas and study designs.",
    "Practice program-based numericals and short answers.",
    "Use weekly MCQ blocks for public health topics.",
  ],
};

const getTrendMeta = (trend, score) => {
  if (trend === "up") return { icon: <FiTrendingUp />, iconClass: "trend-up", scoreClass: "score-blue" };
  if (trend === "down")
    return { icon: <FiTrendingDown />, iconClass: "trend-down", scoreClass: "score-amber" };
  if (score >= 75) return { icon: <FiMinus />, iconClass: "trend-flat", scoreClass: "score-blue" };
  return { icon: <FiMinus />, iconClass: "trend-flat", scoreClass: "score-amber" };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const clampNormalizedScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return NaN;
  return Number(clamp(num, 0, 100).toFixed(1));
};
const deriveNormalizedScore = (row) => {
  const normalizedScore = clampNormalizedScore(row?.normalized_score);
  if (Number.isFinite(normalizedScore)) return normalizedScore;

  const finalScore = clampNormalizedScore(row?.final_score);
  if (Number.isFinite(finalScore)) return finalScore;

  const marks = Number(row?.marks_obtained);
  const maxMarks = Number(row?.max_marks);
  if (Number.isFinite(marks) && Number.isFinite(maxMarks) && maxMarks > 0) {
    return clampNormalizedScore((marks / maxMarks) * 100);
  }
  return NaN;
};

const normalizeExamName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const compact = raw.toLowerCase().replace(/\s+/g, " ");
  if (compact === "mbbs internal 1" || compact === "internal 1") return "Internal 1";
  if (compact === "mbbs internal 2" || compact === "internal 2") return "Internal 2";
  if (compact === "mbbs mid term" || compact === "mid term" || compact === "midterm") return "Midterm";
  if (compact === "mbbs final" || compact === "final exam" || compact === "final") return "Final Exam";
  return raw;
};

const formatReportValue = (value, digits = 2) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : "N/A";
};

const sortExamOptions = (left, right) =>
  (EXAM_DISPLAY_ORDER[normalizeExamName(left?.label || left?.value)] ?? Number.MAX_SAFE_INTEGER) -
    (EXAM_DISPLAY_ORDER[normalizeExamName(right?.label || right?.value)] ?? Number.MAX_SAFE_INTEGER) ||
  String(left?.label || left?.value || "").localeCompare(String(right?.label || right?.value || ""));

const seedRatio = (rollNo, subjectName, examName) => {
  const input = `${String(rollNo || "").trim().toUpperCase()}_${String(subjectName || "").trim().toUpperCase()}_${String(examName || "").trim().toUpperCase()}`;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) % 1000003;
  }
  return (hash % 1000) / 1000;
};

const buildFallbackSubjectMark = ({ rollNo, department, studentYear, subjectName, examName }) => {
  const examKey = normalizeExamName(examName);
  const examMax = Number(EXAM_MAX_BY_NAME[examKey] || 100);
  const profileBands = [34, 42, 49, 57, 64, 71, 78, 84, 88, 92];
  const rollMatch = String(rollNo || "").match(/(\d+)$/);
  const rollBucket = rollMatch ? (Number(rollMatch[1]) - 1) % profileBands.length : 4;
  const base = profileBands[rollBucket];
  const yearBoost = department === "MD" ? (studentYear === 1 ? 4 : 7) : [0, -2, 1, 4, 6][studentYear] ?? 0;
  const subjectNoise = (seedRatio(rollNo, subjectName, "subject") - 0.5) * 12;
  const examNoise = (seedRatio(rollNo, subjectName, examKey) - 0.5) * 10;
  const normalized = Number(clamp(base + yearBoost + subjectNoise + examOffsetByName[examKey] + examNoise, 22, 94).toFixed(1));
  const marks = Math.round((normalized / 100) * examMax);
  const subjectMax = department === "MD"
    ? Number(MD_SUBJECT_MAX_BY_NAME[subjectName] || 100)
    : Number(MBBS_SUBJECT_MAX_BY_NAME[subjectName] || 100);

  return {
    normalized,
    marks,
    maxMarks: examMax,
    subjectMax,
  };
};

const examOffsetByName = {
  "Internal 1": -6,
  "Internal 2": -3,
  Midterm: 1,
  "Final Exam": 4,
};

function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedExam, setSelectedExam] = useState(exams[0]);
  const [queryType, setQueryType] = useState("");
  const [queryFacultyId, setQueryFacultyId] = useState("");
  const [queryFacultyList, setQueryFacultyList] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [formError, setFormError] = useState("");
  const [queries, setQueries] = useState([]);
  const [reportPayload, setReportPayload] = useState({
    final_score: null,
    rank: null,
    class_average: null,
    scores: [],
  });
  const [classTopRows, setClassTopRows] = useState([]);
  const [mentorFromApi, setMentorFromApi] = useState(null);
  const [studentProfile, setStudentProfile] = useState({
    ...defaultStudentProfile,
  });

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token) return () => { cancelled = true; };

    const loadProfile = async () => {
      try {
        const [authRes, profileRes] = await Promise.all([
          fetch(`/api/auth/me?_ts=${Date.now()}`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }),
          fetch(`/api/student/me/profile?_ts=${Date.now()}`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }),
        ]);
        const authPayload = authRes.ok ? await authRes.json() : null;
        const authUser = authPayload?.user || {};
        const profile = profileRes.ok ? await profileRes.json() : {};
        if (cancelled) return;
        const fallbackName = String(authUser?.name || defaultStudentProfile.name).trim();
        const fallbackEmail = String(authUser?.email || "").trim();
        const semesterNum = Number(profile?.semester);
        const degreeFromApi = String(profile?.degree || "").trim();
        const department = String(profile?.department || "").trim().toUpperCase();
        const degree =
          degreeFromApi ||
          (Number.isFinite(semesterNum) && semesterNum > 0
            ? `${department || "MBBS"} Year ${Math.ceil(semesterNum / 2)}`
            : "N/A");
        setStudentProfile((prev) => ({
          ...prev,
          name: String(profile?.name || fallbackName || prev.name || defaultStudentProfile.name),
          email: String(profile?.email || fallbackEmail || prev.email || ""),
          degree: degree !== "N/A" ? degree : (prev.degree || "N/A"),
          rollNo: String(profile?.usn || prev.rollNo || defaultStudentProfile.rollNo),
          semester: Number.isFinite(semesterNum) ? semesterNum : prev.semester,
        }));
        const mentorName = String(profile?.mentor_name || "").trim();
        const mentorEmail = String(profile?.mentor_email || "").trim();
        if (mentorName || mentorEmail) {
          setMentorFromApi({
            name: mentorName || "Assigned Mentor",
            role: "Academic Mentor",
            unit: `${String(profile?.department || "").toUpperCase() || "Department"} Mentorship`,
            email: mentorEmail || "N/A",
            phone: "N/A",
            nextMeeting: "Check with mentor",
            totalSessions: 0,
            sessions: [
              { id: 1, title: "Mentor Session", date: "TBA", status: "Upcoming" },
            ],
          });
        }
      } catch {
        // Keep fallback profile on fetch failure.
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token) return () => { cancelled = true; };

    const loadQueryFaculty = async () => {
      try {
        const res = await fetch(`/api/student/me/query-faculty?_ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) return;
        const rows = await res.json();
        if (cancelled) return;
        setQueryFacultyList(
          (Array.isArray(rows) ? rows : []).map((row) => ({
            staffId: Number(row.staff_id),
            staffName: String(row.staff_name || "Faculty"),
            staffEmail: String(row.staff_email || ""),
            department: String(row.department_code || "").trim().toUpperCase(),
            subjects: Array.isArray(row.subjects)
              ? row.subjects.map((value) => String(value || "").trim()).filter(Boolean)
              : [],
          }))
        );
      } catch {
        // keep faculty list empty when API fails
      }
    };

    loadQueryFaculty();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!queryFacultyId) return;
    const hasSelectedFaculty = queryFacultyList.some(
      (faculty) => String(faculty.staffId) === String(queryFacultyId)
    );
    if (!hasSelectedFaculty) setQueryFacultyId("");
  }, [queryFacultyId, queryFacultyList]);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token) return () => { cancelled = true; };

    const loadQueries = async () => {
      try {
        const res = await fetch(`/api/student/me/queries?_ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) return;
        const rows = await res.json();
        if (cancelled) return;
        setQueries(
          (Array.isArray(rows) ? rows : []).map((row) => ({
            id: Number(row.id),
            type: String(row.query_type || "academic"),
            subject: String(row.subject || "Academic Query"),
            status: String(row.status || "pending"),
            to: String(row.staff_name || "Faculty Team"),
            date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "Today",
            question: String(row.question || ""),
            response: String(row.response || ""),
          }))
        );
      } catch {
        // keep fallback when API fails
      }
    };

    loadQueries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token || !selectedExam) return () => { cancelled = true; };

    const loadClassTop = async () => {
      try {
        const res = await fetch(
          `/api/student/me/class-top?exam_name=${encodeURIComponent(selectedExam)}&_ts=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );
        if (!res.ok) return;
        const rows = await res.json();
        if (cancelled) return;
        setClassTopRows(Array.isArray(rows) ? rows : []);
      } catch {
        // Keep fallback class list.
      }
    };

    loadClassTop();
    return () => {
      cancelled = true;
    };
  }, [selectedExam]);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token) return () => { cancelled = true; };

    const loadReport = async () => {
      try {
        const res = await fetch(`/api/student/me/report?_ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (cancelled) return;
        setReportPayload({
          final_score: Number(payload?.final_score),
          rank: Number(payload?.rank),
          class_average: Number(payload?.class_average),
          scores: Array.isArray(payload?.scores) ? payload.scores : [],
        });
      } catch {
        // Keep fallback data.
      }
    };

    loadReport();
    return () => {
      cancelled = true;
    };
  }, []);

  const studentYear = useMemo(() => {
    const semester = Number(studentProfile.semester);
    if (Number.isFinite(semester) && semester > 0) return Math.ceil(semester / 2);
    const yearMatch = String(studentProfile.degree || "").match(/year\s*(\d+)/i);
    const byDegree = yearMatch ? Number(yearMatch[1]) : NaN;
    if (Number.isFinite(byDegree) && byDegree > 0) return byDegree;
    const roll = String(studentProfile.rollNo || "").toUpperCase();
    if (roll.startsWith("2025MBBS")) return 1;
    if (roll.startsWith("2024MBBS")) return 2;
    if (roll.startsWith("2023MBBS")) return 3;
    return 3;
  }, [studentProfile.degree, studentProfile.rollNo, studentProfile.semester]);

  const yearSubjectNames = useMemo(() => {
    const dept = String(studentProfile.degree || "").toUpperCase().includes("MD")
      || String(studentProfile.rollNo || "").toUpperCase().includes("MD")
      ? "MD"
      : "MBBS";

    if (dept === "MD") return MD_SUBJECTS_BY_YEAR[studentYear] || MD_SUBJECTS_BY_YEAR[2];
    return MBBS_SUBJECTS_BY_YEAR[studentYear] || MBBS_SUBJECTS_BY_YEAR[4];
  }, [studentProfile.degree, studentProfile.rollNo, studentYear]);

  const availableExamOptions = useMemo(() => {
    const fromScores = (Array.isArray(reportPayload.scores) ? reportPayload.scores : []).reduce((acc, row) => {
      const rawExamName = String(row.exam_name || "").trim();
      const label = normalizeExamName(rawExamName);
      if (!rawExamName || !label || acc.some((option) => option.label === label)) return acc;
      acc.push({ value: rawExamName, label });
      return acc;
    }, []);
    if (fromScores.length === 0) {
      return exams.map((exam) => ({ value: exam, label: normalizeExamName(exam) })).sort(sortExamOptions);
    }
    return fromScores.sort(sortExamOptions);
  }, [reportPayload.scores]);

  useEffect(() => {
    const optionValues = availableExamOptions.map((option) => option.value);
    setSelectedExam((prev) => (optionValues.includes(prev) ? prev : availableExamOptions[0]?.value || exams[0]));
  }, [availableExamOptions]);

  const selectedExamLabel = useMemo(() => {
    const selected = availableExamOptions.find((option) => option.value === selectedExam);
    return selected?.label || normalizeExamName(selectedExam);
  }, [availableExamOptions, selectedExam]);

  const subjects = useMemo(() => {
    const department = String(studentProfile.degree || "").toUpperCase().includes("MD")
      || String(studentProfile.rollNo || "").toUpperCase().includes("MD")
      ? "MD"
      : "MBBS";
    const allRows = Array.isArray(reportPayload.scores) ? reportPayload.scores : [];
    const examRows = allRows.filter((row) => normalizeExamName(row.exam_name) === selectedExamLabel);
    const examIndex = availableExamOptions.findIndex((option) => option.value === selectedExam);
    const previousExam = examIndex > 0 ? availableExamOptions[examIndex - 1]?.value : "";
    const previousExamLabel = previousExam ? normalizeExamName(previousExam) : "";
    const prevRows = previousExam
      ? allRows.filter((row) => normalizeExamName(row.exam_name) === previousExamLabel)
      : [];
    const summarizeRowsBySubject = (rows) => rows.reduce((acc, row) => {
      const subjectKey = String(row.subject_name || "").trim().toLowerCase();
      if (!subjectKey) return acc;
      const marks = Number(row.marks_obtained);
      const maxMarks = Number(row.max_marks);
      const prev = acc[subjectKey] || { marks: 0, maxMarks: 0 };
      acc[subjectKey] = {
        marks: prev.marks + (Number.isFinite(marks) ? marks : 0),
        maxMarks: prev.maxMarks + (Number.isFinite(maxMarks) && maxMarks > 0 ? maxMarks : 0),
      };
      return acc;
    }, {});
    const examSummaryBySubject = summarizeRowsBySubject(examRows);
    const prevSummaryBySubject = summarizeRowsBySubject(prevRows);

    return yearSubjectNames.map((subjectName) => {
      const subjectKey = String(subjectName).toLowerCase();
      const summary = examSummaryBySubject[subjectKey];
      const marks = Number(summary?.marks);
      const maxMarks = Number(summary?.maxMarks);
      const normalized = Number.isFinite(marks) && Number.isFinite(maxMarks) && maxMarks > 0
        ? clampNormalizedScore((marks / maxMarks) * 100)
        : 0;
      const prevSummary = prevSummaryBySubject[subjectKey];
      const prev = Number.isFinite(Number(prevSummary?.marks)) && Number.isFinite(Number(prevSummary?.maxMarks)) && Number(prevSummary?.maxMarks) > 0
        ? clampNormalizedScore((Number(prevSummary.marks) / Number(prevSummary.maxMarks)) * 100)
        : NaN;
      const delta = Number.isFinite(prev) ? normalized - prev : 0;
      const trend = delta > 0.3 ? "up" : delta < -0.3 ? "down" : "flat";
      const classAverage = Number.isFinite(reportPayload.class_average)
        ? Number(reportPayload.class_average.toFixed(1))
        : Number(clamp(normalized - 8 + ((seedRatio(studentProfile.rollNo, subjectName, "avg") - 0.5) * 6), 20, 92).toFixed(1));
      const classHighest = Number(clamp(Math.max(normalized, classAverage + 8), 0, 100).toFixed(1));
      const percentile = Number(clamp(100 - ((Number.isFinite(reportPayload.rank) ? reportPayload.rank : 20) - 1) * 2, 1, 99).toFixed(0));
      const hasActualMarks = Number.isFinite(marks) && Number.isFinite(maxMarks) && maxMarks > 0;
      return {
        name: subjectName,
        normalized,
        raw: hasActualMarks ? `${marks}/${maxMarks}` : "N/A",
        classAvg: classAverage,
        classHighest,
        percentile,
        trend,
        hasActualMarks,
      };
    });
  }, [availableExamOptions, reportPayload.class_average, reportPayload.rank, reportPayload.scores, selectedExam, selectedExamLabel, studentProfile.degree, studentProfile.rollNo, studentYear, yearSubjectNames]);

  const chartData = useMemo(
    () =>
      subjects.map((item) => ({
        subject:
          item.name === "General Medicine"
            ? "General Me..."
            : item.name === "General Surgery"
              ? "General Su..."
              : item.name.length > 11
                ? `${item.name.slice(0, 9)}...`
                : item.name,
        yourScore: Number(item.normalized.toFixed(1)),
        highestInClass: Number(item.classHighest.toFixed(1)),
      })),
    [subjects]
  );
  const topClassNormalizedScores = useMemo(
    () => {
      const fromApi = (Array.isArray(classTopRows) ? classTopRows : [])
        .map((row, index) => ({
          rank: index + 1,
          name: String(row.student_name || row.usn || "Student"),
          score: deriveNormalizedScore(row),
        }))
        .filter((row) => Number.isFinite(row.score))
        .sort((a, b) => b.score - a.score)
        .map((row, index) => ({ ...row, rank: index + 1 }));
      if (fromApi.length > 0) return fromApi;
      return [...(classNormalizedScoresByExam[normalizeExamName(selectedExam)] || [{ studentName: studentProfile.name, normalizedScore: 0 }])]
        .sort((a, b) => b.normalizedScore - a.normalizedScore)
        .slice(0, 6)
        .map((item, index) => ({
          rank: index + 1,
          name: item.studentName,
          score: Number(item.normalizedScore.toFixed(1)),
        }));
    },
    [classTopRows, selectedExam, studentProfile.name]
  );
  const excellentSubjects = useMemo(
    () => subjects.filter((item) => item.normalized >= 85).map((item) => item.name),
    [subjects]
  );
  const weakSubjects = useMemo(
    () => subjects.filter((item) => item.normalized < 70).map((item) => item.name),
    [subjects]
  );
  const aboveAverageCount = useMemo(
    () => subjects.filter((item) => item.normalized >= item.classAvg).length,
    [subjects]
  );
  const overallApiScore = useMemo(() => {
    if (Number.isFinite(reportPayload.final_score)) return clampNormalizedScore(reportPayload.final_score);
    if (subjects.length > 0) {
      const avg = subjects.reduce((sum, item) => sum + item.normalized, 0) / subjects.length;
      return clampNormalizedScore(avg);
    }
    return 0;
  }, [reportPayload.final_score, subjects]);
  const highestSubjectScore = useMemo(() => {
    if (subjects.length === 0) return 0;
    return Number(Math.max(...subjects.map((item) => item.normalized)).toFixed(1));
  }, [subjects]);
  const weakAnalysisSubjects = useMemo(
    () =>
      [...subjects]
        .filter((item) => item.normalized < 75)
        .sort((a, b) => a.normalized - b.normalized)
        .slice(0, 2),
    [subjects]
  );
  const urgentSubjects = useMemo(
    () => [...subjects].filter((item) => item.normalized < 70).sort((a, b) => a.normalized - b.normalized),
    [subjects]
  );
  const assignedMentor = useMemo(
    () => mentorFromApi || mentorByYear[studentYear] || mentorByYear[3],
    [mentorFromApi, studentYear]
  );
  const improvementValue = useMemo(() => {
    const examIndex = availableExamOptions.findIndex((option) => option.value === selectedExam);
    if (examIndex <= 0) return "0.0%";
    const prevExam = availableExamOptions[examIndex - 1]?.value;
    const prevExamLabel = prevExam ? normalizeExamName(prevExam) : "";
    const prevSubjects = (Array.isArray(reportPayload.scores) ? reportPayload.scores : [])
      .filter((row) => normalizeExamName(row.exam_name) === prevExamLabel)
      .map((row) => clampNormalizedScore(row.normalized_score))
      .filter((value) => Number.isFinite(value));
    if (prevSubjects.length === 0 || subjects.length === 0) return "0.0%";
    const prevAvg = prevSubjects.reduce((sum, value) => sum + value, 0) / prevSubjects.length;
    const currAvg = subjects.reduce((sum, item) => sum + item.normalized, 0) / subjects.length;
    const delta = Number((currAvg - prevAvg).toFixed(1));
    return `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%`;
  }, [availableExamOptions, reportPayload.scores, selectedExam, subjects]);
  const trendData = useMemo(
    () =>
      availableExamOptions.map((examOption) => {
        const rows = (Array.isArray(reportPayload.scores) ? reportPayload.scores : [])
          .filter((row) => normalizeExamName(row.exam_name) === examOption.label);
        const avg = rows.length > 0
          ? rows.reduce((sum, item) => sum + clampNormalizedScore(item.normalized_score || 0), 0) / rows.length
          : 0;
        return { exam: examOption.label.replace("MBBS ", "").replace("MD ", ""), score: clampNormalizedScore(avg) };
      }),
    [availableExamOptions, reportPayload.scores]
  );

  const submitQuery = (event) => {
    event.preventDefault();
    const cleanText = queryText.trim();
    const selectedFaculty = queryFacultyList.find(
      (faculty) => String(faculty.staffId) === String(queryFacultyId)
    );
    const subjectFromFaculty = selectedFaculty?.subjects?.[0] || "General Query";
    if (!queryType || !selectedFaculty || !cleanText) {
      if (!queryType) {
        setFormError("Please select query type.");
      } else if (!selectedFaculty) {
        setFormError("Please select faculty.");
      } else {
        setFormError("Please enter your query.");
      }
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setFormError("Login required");
      return;
    }
    const post = async () => {
      const res = await fetch("/api/student/me/queries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query_type: queryType,
          staff_id: selectedFaculty.staffId,
          subject: subjectFromFaculty,
          question: cleanText,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to submit query");
      }
      const row = await res.json();
      setQueries((prev) => [
        {
          id: Number(row.id),
          type: String(row.query_type || queryType),
          subject: String(row.subject || subjectFromFaculty),
          status: String(row.status || "pending"),
          to: String(row.staff_name || selectedFaculty.staffName || assignedMentor?.name || "Faculty Team"),
          date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "Today",
          question: String(row.question || cleanText),
          response: String(row.response || ""),
        },
        ...prev,
      ]);
      setFormError("");
      setQueryType("");
      setQueryFacultyId("");
      setQueryText("");
      setActiveTab("queries");
    };
    post().catch((error) => setFormError(error.message || "Failed to submit query"));
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/", { replace: true });
  };

  const handleDownloadReport = () => {
    const safeName = String(studentProfile.name || "student").trim() || "student";
    const fileName = `${safeName.replace(/\s+/g, "_")}_report.txt`;
    const generatedAt = new Date().toLocaleString();
    const scoreRows = Array.isArray(reportPayload.scores) ? reportPayload.scores : [];

    const lines = [
      "Academic Performance Report",
      `Generated: ${generatedAt}`,
      "",
      `Student Name: ${studentProfile.name || "N/A"}`,
      `Email: ${studentProfile.email || "N/A"}`,
      `Course: ${studentProfile.degree || "N/A"}`,
      `Roll No: ${studentProfile.rollNo || "N/A"}`,
      "",
      `Overall Normalized Score: ${formatReportValue(reportPayload.final_score)}`,
      `Class Rank: ${Number.isFinite(Number(reportPayload.rank)) ? reportPayload.rank : "N/A"}`,
      `Class Average: ${formatReportValue(reportPayload.class_average)}`,
      "",
      "Detailed Scores",
      ...scoreRows.map((row) =>
        `${normalizeExamName(row.exam_name)} | ${row.subject_name || "N/A"} | ` +
        `Marks: ${formatReportValue(row.marks_obtained)} / ${formatReportValue(row.max_marks)} | ` +
        `Normalized: ${formatReportValue(row.normalized_score)}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="student-dashboard-shell">
      <div className="student-container">
        <header className="student-title-row">
          <div className="title-wrap">
            <div className="title-icon">
              <FiBookOpen />
            </div>
            <div>
              <h1>Academic Performance Normalizer</h1>
              <p>
                <FiUser /> {studentProfile.name}
                {studentProfile.email ? ` (${studentProfile.email})` : ""}
                {" "}• {studentProfile.degree} • Roll No: {studentProfile.rollNo}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="download-btn" type="button" onClick={handleDownloadReport}>
              <FiDownload /> Download Report
            </button>
            <button className="download-btn" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="exam-panel">
          <div className="exam-left">
            <label htmlFor="exam-select">Select Exam:</label>
            <div className="exam-select-wrap">
              <select
                id="exam-select"
                value={selectedExam}
                onChange={(event) => setSelectedExam(event.target.value)}
              >
                {availableExamOptions.map((exam) => (
                  <option key={exam.value} value={exam.value}>
                    {exam.label}
                  </option>
                ))}
              </select>
              <FiChevronDown />
            </div>
          </div>
          <div className="exam-right">
            <span className="term-pill">Spring 2026</span>
            <span className="term-date">Jan 2026</span>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-head">
              <h3>Normalized Score</h3>
              <span className="stat-badge blue-badge">
                <FiTarget />
              </span>
            </div>
            <p className="stat-value blue-value">{overallApiScore}</p>
          </article>
          <article className="stat-card">
            <div className="stat-head">
              <h3>Total Subjects</h3>
              <span className="stat-badge purple-badge">
                <FiBookOpen />
              </span>
            </div>
            <p className="stat-value purple-value">{subjects.length}</p>
          </article>
          <article className="stat-card">
            <div className="stat-head">
              <h3>Highest Score</h3>
              <span className="stat-badge green-badge">
                <FiCheckCircle />
              </span>
            </div>
            <p className="stat-value green-value">{highestSubjectScore}</p>
          </article>
          <article className="stat-card">
            <div className="stat-head">
              <h3>Improvement</h3>
              <span className="stat-badge green-badge">
                <FiTrendingUp />
              </span>
            </div>
            <p className="stat-value green-value">{improvementValue}</p>
          </article>
        </section>

        <section className="tab-strip">
          {["overview", "subjects", "analysis", "queries", "mentor"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "tab-btn active" : "tab-btn"}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </section>

        {activeTab === "overview" && (
          <section className="tab-content">
            <div className="chart-grid">
              <article className="panel-card">
                <h2>Top 6 Normalized Scores in Class</h2>
                <div className="top-score-list">
                  {topClassNormalizedScores.map((item) => (
                    <div key={item.name} className="top-score-row">
                      <span className="rank-badge">{item.rank}</span>
                      <span className="top-score-subject">{item.name}</span>
                      <strong className="top-score-value">{item.score}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel-card">
                <h2>Performance Trend</h2>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#cbced5" />
                    <XAxis dataKey="exam" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Average Normalized Score"
                      stroke="#3f7bda"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ffffff", stroke: "#3f7bda", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </article>
            </div>

            <article className="panel-card">
              <h2>Insights & Recommendations</h2>
              <div className="insight-stack">
                <div className="insight-row success">
                  <FiCheckCircle />
                  <span>
                    Excellent performance in {excellentSubjects.length} subject(s):
                    {" "}{excellentSubjects.length > 0 ? excellentSubjects.join(", ") : "Keep pushing for 85+ scores"}
                  </span>
                </div>
                <div className="insight-row danger">
                  <FiAlertTriangle />
                  <span>
                    Need improvement in: {weakSubjects.length > 0 ? weakSubjects.join(", ") : "None"}.
                    {weakSubjects.length > 0 ? " Focus on practice tests and faculty doubt sessions." : " Maintain consistency."}
                  </span>
                </div>
                <div className="insight-row info">
                  <FiHelpCircle />
                  <span>
                    You're performing above class average in {aboveAverageCount} out of {subjects.length} subjects.
                  </span>
                </div>
              </div>
            </article>
          </section>
        )}

        {activeTab === "subjects" && (
          <section className="tab-content">
            <div className="subject-grid">
              {subjects.map((subject) => {
                const trendMeta = getTrendMeta(subject.trend, subject.normalized);
                return (
                  <article key={subject.name} className="subject-card">
                    <div className="subject-head">
                      <h3>{subject.name}</h3>
                      <span className={trendMeta.iconClass}>{trendMeta.icon}</span>
                    </div>

                    <div className="subject-score-row">
                      <span>Normalized Score</span>
                      <strong className={trendMeta.scoreClass}>{subject.normalized}</strong>
                    </div>

                    <div className="subject-progress">
                      <div className="subject-progress-fill" style={{ width: `${subject.normalized}%` }} />
                    </div>

                    <div className="subject-meta">
                      <div>
                        <p>Raw Score</p>
                        <strong>{subject.raw}</strong>
                      </div>
                      <div>
                        <p>Class Avg</p>
                        <strong>{subject.classAvg}</strong>
                      </div>
                    </div>

                    <div className="subject-percentile">
                      <p>Percentile Rank</p>
                      <strong>{subject.percentile}th percentile</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <article className="panel-card">
              <h2>Performance Comparison</h2>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#cbced5" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yourScore" name="Your Score" fill="#3f7bda" />
                  <Bar dataKey="highestInClass" name="Highest in Class" fill="#8a99ad" />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </section>
        )}

        {activeTab === "analysis" && (
          <section className="tab-content">
            <article className="panel-card urgent-card">
              <p>
                <FiAlertTriangle /> <strong>Urgent Attention Required:</strong>
              </p>
              <span>
                {urgentSubjects.length} subject(s) need immediate focus
                {urgentSubjects.length > 0 ? ` - ${urgentSubjects.map((item) => item.name).join(", ")}` : " - Keep current momentum"}
              </span>
            </article>

            <article className="panel-card">
              <h2 className="icon-title">
                <FiTarget /> Subject-wise Weakness Analysis
              </h2>

              {weakAnalysisSubjects.length === 0 ? (
                <div className="analysis-card warning">
                  <div className="analysis-head">
                    <h3>No major weak subjects</h3>
                    <span className="status-chip warning-chip">
                      <FiCheckCircle /> Stable
                    </span>
                  </div>
                  <div className="analysis-grid">
                    <div>
                      <p>Current Focus</p>
                      <strong className="score-blue">Maintain consistency</strong>
                    </div>
                    <div>
                      <p>Suggested Target</p>
                      <strong>Push all subjects above 85%</strong>
                    </div>
                  </div>
                </div>
              ) : weakAnalysisSubjects.map((subject) => {
                const isCritical = subject.normalized < 65;
                const targetGap = Number((85 - subject.normalized).toFixed(1));
                const progress = Math.min(100, Math.max(0, Number(((subject.normalized / 85) * 100).toFixed(0))));
                const recommendations = recommendationMap[subject.name] || [
                  "Revise core concepts and topic summaries.",
                  "Practice previous-year questions with timing.",
                  "Discuss weak areas with assigned mentor.",
                ];

                return (
                  <div key={subject.name} className={`analysis-card ${isCritical ? "critical" : "warning"}`}>
                    <div className="analysis-head">
                      <h3>{subject.name}</h3>
                      <span className={`status-chip ${isCritical ? "critical-chip" : "warning-chip"}`}>
                        {isCritical ? <FiAlertTriangle /> : <FiTrendingDown />} {isCritical ? "Critical" : "Needs Improvement"}
                      </span>
                    </div>
                    <div className="analysis-grid">
                      <div>
                        <p>Current Score</p>
                        <strong className={isCritical ? "danger-text" : "amber-text"}>{subject.normalized.toFixed(1)}%</strong>
                        <p className="mt">Percentile Rank</p>
                        <strong>{subject.percentile}th</strong>
                      </div>
                      <div>
                        <p>Gap to Target (85%)</p>
                        <strong>{targetGap > 0 ? `${targetGap}%` : "Target reached"}</strong>
                        <p className="mt">Progress to Target</p>
                        <div className="target-progress">
                          <div style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="action-panel">
                      <h4>Recommended Actions:</h4>
                      <ul>
                        {recommendations.map((tip) => <li key={`${subject.name}-${tip}`}>{tip}</li>)}
                        <li>Schedule a mentoring session to discuss improvement strategies</li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </article>

            <article className="panel-card">
              <h2 className="icon-title">
                <FiBookOpen /> General Study Recommendations
              </h2>
              <div className="general-tip blue-tip">
                <FiHelpCircle />
                <div>
                  <h4>Time Management:</h4>
                  <p>Allocate more study time to subjects with lower scores. Aim for 2-3 hours daily for critical subjects.</p>
                </div>
              </div>
              <div className="general-tip violet-tip">
                <FiHelpCircle />
                <div>
                  <h4>Active Learning:</h4>
                  <p>Don't just read - practice solving questions, create summaries, and teach concepts to peers for better retention.</p>
                </div>
              </div>
              <div className="general-tip green-tip">
                <FiHelpCircle />
                <div>
                  <h4>Faculty Consultation:</h4>
                  <p>Don't hesitate to raise queries through the Query Section. Regular interaction with faculty helps clarify doubts early.</p>
                </div>
              </div>
              <div className="general-tip amber-tip">
                <FiHelpCircle />
                <div>
                  <h4>Practice Questions:</h4>
                  <p>Solve at least 50 MCQs per subject weekly. Focus on previous year papers and standard question banks.</p>
                </div>
              </div>
            </article>
          </section>
        )}

        {activeTab === "queries" && (
          <section className="tab-content">
            <article className="panel-card">
              <h2 className="icon-title">
                <FiMessageSquare /> Ask Your Faculty
              </h2>
              <p className="subline">Raise your doubts and queries directly to the respective subject faculty</p>
              <form className="query-form" onSubmit={submitQuery}>
                <label htmlFor="query-type">Query Type</label>
                <div className="query-select-wrap">
                  <select
                    id="query-type"
                    value={queryType}
                    onChange={(event) => setQueryType(event.target.value)}
                  >
                    <option value="">Choose query type</option>
                    <option value="academic">Academic</option>
                    <option value="marks">Marks</option>
                  </select>
                  <FiChevronDown />
                </div>
                <label htmlFor="query-faculty">Faculty</label>
                <div className="query-select-wrap">
                  <select
                    id="query-faculty"
                    value={queryFacultyId}
                    onChange={(event) => setQueryFacultyId(event.target.value)}
                  >
                    <option value="">Choose faculty</option>
                    {queryFacultyList.map((faculty) => {
                      const subjectsLabel = faculty.subjects.length > 0
                        ? faculty.subjects.join(", ")
                        : "No subjects assigned";
                      const departmentLabel = faculty.department || "Department N/A";
                      return (
                        <option key={faculty.staffId} value={faculty.staffId}>
                          {faculty.staffName} - {departmentLabel} ({subjectsLabel})
                        </option>
                      );
                    })}
                  </select>
                  <FiChevronDown />
                </div>
                {queryFacultyList.length === 0 && (
                  <p className="form-error">No faculty found. Please contact admin to map staff and department.</p>
                )}
                <label htmlFor="query-text">Your Query</label>
                <textarea
                  id="query-text"
                  placeholder={
                    queryType === "marks"
                      ? "Type your marks-related query here..."
                      : "Type your academic query here..."
                  }
                  value={queryText}
                  onChange={(event) => setQueryText(event.target.value)}
                />
                {formError && <p className="form-error">{formError}</p>}
                <button type="submit" className="submit-query">
                  <FiSend /> Submit Query
                </button>
              </form>
            </article>

            <article className="panel-card">
              <h2>Your Queries</h2>
              <p className="subline">Track your submitted questions and responses</p>
              <div className="queries-list">
                {queries.map((query) => (
                  <div className="query-entry" key={query.id}>
                    <div className="query-head">
                      <h3>{query.subject}</h3>
                      <div className="query-tags">
                        <span className="status query-type-tag">
                          {(query.type || "academic").charAt(0).toUpperCase() + (query.type || "academic").slice(1)}
                        </span>
                        <span className={query.status === "answered" ? "status answered" : "status pending"}>
                          {query.status === "answered" ? <FiCheckCircle /> : <FiCalendar />}
                          {query.status === "answered" ? "Answered" : "Pending"}
                        </span>
                      </div>
                    </div>
                    <p className="query-meta">
                      To: {query.to} - {query.date}
                    </p>
                    <div className="question-block">
                      <h4>Your Question:</h4>
                      <p>{query.question}</p>
                    </div>
                    {query.status === "answered" && (
                      <div className="response-block">
                        <h4>Faculty Response:</h4>
                        <p>{query.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === "mentor" && (
          <section className="tab-content">
            <article className="panel-card mentor-card">
              <div className="mentor-top">
                <div className="mentor-avatar">
                  <FiUser />
                </div>
                <div>
                  <h2>{assignedMentor.name}</h2>
                  <p>{assignedMentor.role}</p>
                  <span className="mentor-dept">{assignedMentor.unit}</span>
                </div>
              </div>
              <button className="contact-btn" type="button">
                <FiMessageSquare /> Contact
              </button>

              <div className="mentor-contact-grid">
                <p>
                  <FiMessageSquare /> {assignedMentor.email}
                </p>
                <p>
                  <FiPhone /> {assignedMentor.phone}
                </p>
              </div>

              <div className="mentor-stats">
                <div>
                  <p>
                    <FiCalendar /> Next Meeting
                  </p>
                  <strong>{assignedMentor.nextMeeting}</strong>
                </div>
                <div>
                  <p>
                    <FiMessageSquare /> Total Sessions
                  </p>
                  <strong>{assignedMentor.totalSessions}</strong>
                </div>
              </div>
            </article>

            <article className="panel-card">
              <h2>Mentoring Sessions</h2>
              <div className="session-list">
                {assignedMentor.sessions.map((session) => (
                  <div className="session-row" key={session.id}>
                    <div>
                      <h3>{session.title}</h3>
                      <p>{session.date}</p>
                    </div>
                    <span className={session.status === "Completed" ? "session-status done" : "session-status upcoming"}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
