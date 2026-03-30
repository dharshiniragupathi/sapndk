import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  FiAlertTriangle,
  FiAward,
  FiBook,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiFilter,
  FiInfo,
  FiPaperclip,
  FiSearch,
  FiSend,
  FiTrendingDown,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { clearAuthSession, getAuthToken, getStaffDepartment } from "../../utils/authStorage";
import {
  computeSubjectPercentageFromExamRows,
  computeSubjectTotalsFromExamRows,
  MBBS_EXAM_STRUCTURE,
} from "../../data/mbbsDemoMarksSeed";
import "./StaffDashboard.css";

const SUBJECTS = [
  { key: "anatomy", label: "Anatomy", short: "Anatomy" },
  { key: "physiology", label: "Physiology", short: "Physiology" },
  { key: "biochemistry", label: "Biochemistry", short: "Biochem" },
  { key: "pathology", label: "Pathology", short: "Pathology" },
  { key: "microbiology", label: "Microbiology", short: "Micro" },
  { key: "forensicMedicine", label: "Forensic Medicine", short: "Forensic" },
  { key: "communityMedicine", label: "Community Medicine", short: "Community" },
  { key: "ophthalmology", label: "Ophthalmology", short: "Ophthal" },
  { key: "ent", label: "ENT", short: "ENT" },
  { key: "generalMedicine", label: "General Medicine", short: "Gen Med" },
  { key: "generalSurgery", label: "General Surgery", short: "Gen Surg" },
  { key: "obg", label: "OBG", short: "OBG" },
];

const MD_SUBJECTS = [
  "Advanced Pathology",
  "Clinical Medicine",
  "Advanced Pharmacology",
  "Research Methodology",
  "Diagnostic Procedures",
  "Medical Ethics",
  "Critical Care",
  "Advanced Radiology",
  "Hospital Management",
  "Thesis Evaluation",
];

const MBBS_TABLE_SUBJECTS = [
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Pathology",
  "Microbiology",
  "Forensic Medicine",
  "Community Medicine",
  "Ophthalmology",
  "ENT",
  "General Medicine",
  "General Surgery",
  "OBG",
];
const MBBS_YEAR_SUBJECTS = {
  "Year 1": ["Anatomy", "Physiology", "Biochemistry"],
  "Year 2": ["Pathology", "Microbiology", "Forensic Medicine"],
  "Year 3": ["Community Medicine", "Ophthalmology", "ENT"],
  "Year 4": ["General Medicine", "General Surgery", "OBG"],
};
const MD_TABLE_SUBJECTS = [
  "Advanced Pathology",
  "Clinical Medicine",
  "Advanced Pharmacology",
  "Research Methodology",
  "Diagnostic Procedures",
  "Medical Ethics",
  "Critical Care",
  "Advanced Radiology",
  "Hospital Management",
  "Thesis Evaluation",
];
const MD_YEAR_SUBJECTS = {
  "Year 1": MD_TABLE_SUBJECTS.slice(0, 5),
  "Year 2": MD_TABLE_SUBJECTS.slice(5, 10),
};

const EXAMS_BY_DEPARTMENT = {
  MBBS: MBBS_EXAM_STRUCTURE.map((exam) => exam.name),
  MD: ["Internal 1", "Internal 2", "Midterm", "Final Exam"],
};

const STUDENTS = [
  { roll: "2023MBBS019", year: "2023", department: "MBBS", name: "Riya Chatterjee", anatomy: 94.5, physiology: 92.3, biochemistry: 89.7, pathology: 95.8, pharmacology: 84.9, microbiology: 90.2, generalMedicine: 93.5, generalSurgery: 88.4, obg: 90.6 },
  { roll: "2023MBBS007", year: "2023", department: "MBBS", name: "Meera Iyer", anatomy: 93.2, physiology: 90.6, biochemistry: 87.9, pathology: 94.5, pharmacology: 82.7, microbiology: 88.9, generalMedicine: 91.2, generalSurgery: 86.8, obg: 88.5 },
  { roll: "2023MBBS013", year: "2023", department: "MBBS", name: "Ishita Joshi", anatomy: 90.8, physiology: 88.4, biochemistry: 85.6, pathology: 92.7, pharmacology: 80.3, microbiology: 86.7, generalMedicine: 89.8, generalSurgery: 85.2, obg: 86.5 },
  { roll: "2023MBBS002", year: "2023", department: "MBBS", name: "Rahul Verma", anatomy: 91.2, physiology: 87.5, biochemistry: 84.3, pathology: 92.1, pharmacology: 78.9, microbiology: 85.1, generalMedicine: 88.4, generalSurgery: 83.5, obg: 85.7 },
  { roll: "2023MBBS017", year: "2023", department: "MBBS", name: "Tanvi Malhotra", anatomy: 89.4, physiology: 86.7, biochemistry: 83.2, pathology: 91.1, pharmacology: 78.6, microbiology: 84.6, generalMedicine: 87.9, generalSurgery: 82.3, obg: 84.9 },
  { roll: "2023MBBS004", year: "2023", department: "MBBS", name: "Arjun Patel", anatomy: 88.5, physiology: 85.2, biochemistry: 81.7, pathology: 90.3, pharmacology: 76.8, microbiology: 83.7, generalMedicine: 86.1, generalSurgery: 81.2, obg: 83.4 },
  { roll: "2023MBBS011", year: "2023", department: "MBBS", name: "Pooja Desai", anatomy: 87.9, physiology: 84.6, biochemistry: 80.5, pathology: 89.2, pharmacology: 75.8, microbiology: 82.4, generalMedicine: 85.3, generalSurgery: 80.6, obg: 82.9 },
  { roll: "2023MBBS006", year: "2023", department: "MBBS", name: "Vikram Singh", anatomy: 85.7, physiology: 81.9, biochemistry: 77.6, pathology: 87.4, pharmacology: 74.2, microbiology: 80.1, generalMedicine: 83.5, generalSurgery: 78.4, obg: 80.7 },
  { roll: "2023MBBS015", year: "2023", department: "MBBS", name: "Kavya Pillai", anatomy: 83.6, physiology: 80.2, biochemistry: 76.9, pathology: 85.7, pharmacology: 72.8, microbiology: 78.9, generalMedicine: 81.7, generalSurgery: 77.1, obg: 79.3 },
  { roll: "2023MBBS020", year: "2023", department: "MBBS", name: "Akash Sinha", anatomy: 80.2, physiology: 77.8, biochemistry: 74.5, pathology: 82.9, pharmacology: 71.3, microbiology: 75.6, generalMedicine: 78.8, generalSurgery: 73.9, obg: 76.6 },
  { roll: "2024MD001", year: "2024", department: "MD", name: "Aarav Menon", anatomy: 88.2, physiology: 86.9, biochemistry: 84.1, pathology: 90.4, pharmacology: 81.7, microbiology: 85.2, generalMedicine: 91.3, generalSurgery: 80.8, obg: 82.6 },
  { roll: "2024MD002", year: "2024", department: "MD", name: "Bhavana Rao", anatomy: 84.6, physiology: 82.5, biochemistry: 79.8, pathology: 87.1, pharmacology: 78.4, microbiology: 81.6, generalMedicine: 88.2, generalSurgery: 77.9, obg: 80.3 },
  { roll: "2024MD003", year: "2024", department: "MD", name: "Charan Iyer", anatomy: 81.3, physiology: 79.9, biochemistry: 76.7, pathology: 84.8, pharmacology: 74.2, microbiology: 78.1, generalMedicine: 85.4, generalSurgery: 75.6, obg: 77.4 },
  { roll: "2024MD004", year: "2024", department: "MD", name: "Divya Narayanan", anatomy: 77.5, physiology: 75.8, biochemistry: 73.4, pathology: 81.7, pharmacology: 70.8, microbiology: 74.9, generalMedicine: 82.1, generalSurgery: 71.5, obg: 73.2 },
  { roll: "2024MD005", year: "2024", department: "MD", name: "Eshwar Patel", anatomy: 73.2, physiology: 70.6, biochemistry: 68.1, pathology: 78.9, pharmacology: 66.5, microbiology: 71.3, generalMedicine: 79.6, generalSurgery: 67.9, obg: 69.4 },
  { roll: "2025MD001", year: "2025", department: "MD", name: "Farah Siddiqui", anatomy: 86.8, physiology: 84.2, biochemistry: 82.9, pathology: 89.3, pharmacology: 80.5, microbiology: 83.8, generalMedicine: 90.1, generalSurgery: 79.6, obg: 81.2 },
  { roll: "2025MD002", year: "2025", department: "MD", name: "Gokul Prasad", anatomy: 82.9, physiology: 80.4, biochemistry: 78.2, pathology: 86.4, pharmacology: 76.7, microbiology: 79.5, generalMedicine: 87.6, generalSurgery: 75.1, obg: 77.9 },
  { roll: "2025MD003", year: "2025", department: "MD", name: "Harini Krishnan", anatomy: 79.4, physiology: 76.8, biochemistry: 74.6, pathology: 83.2, pharmacology: 72.1, microbiology: 75.8, generalMedicine: 84.2, generalSurgery: 71.4, obg: 74.8 },
  { roll: "2025MD004", year: "2025", department: "MD", name: "Imran Shaik", anatomy: 74.8, physiology: 72.2, biochemistry: 69.7, pathology: 79.5, pharmacology: 67.6, microbiology: 71.1, generalMedicine: 80.8, generalSurgery: 67.2, obg: 69.8 },
  { roll: "2025MD005", year: "2025", department: "MD", name: "Janani Balan", anatomy: 69.2, physiology: 66.9, biochemistry: 63.8, pathology: 75.1, pharmacology: 62.9, microbiology: 66.2, generalMedicine: 77.3, generalSurgery: 62.4, obg: 65.6 },
];

const INITIAL_QUERIES = [
  { id: 1, studentName: "Priya Sharma", roll: "2023MBBS001", subject: "Pharmacology", date: "Feb 10, 2026", question: "Could you please clarify the mechanism of action for beta blockers?", status: "answered", response: "Beta blockers work by blocking the effects of epinephrine on beta-adrenergic receptors. This reduces heart rate, blood pressure, and cardiac output. Please review Chapter 12 for detailed mechanisms." },
  { id: 2, studentName: "Priya Sharma", roll: "2023MBBS001", subject: "OBG", date: "Feb 12, 2026", question: "I need help understanding the stages of labor and their management.", status: "pending", response: "" },
  { id: 3, studentName: "Karthik Rao", roll: "2023MBBS008", subject: "General Medicine", date: "Feb 9, 2026", question: "What are the differential diagnoses for chest pain in young adults?", status: "answered", response: "Common causes include: 1) Musculoskeletal pain, 2) Gastroesophageal reflux, 3) Anxiety/panic attacks, 4) Costochondritis. However, always rule out cardiac causes first, even in young patients." },
  { id: 4, studentName: "Aman Gupta", roll: "2023MBBS003", subject: "Biochemistry", date: "Feb 11, 2026", question: "Can you explain glycolysis regulation with key enzymes?", status: "pending", response: "" },
  { id: 5, studentName: "Vikram Singh", roll: "2023MBBS006", subject: "Pathology", date: "Feb 13, 2026", question: "How should I approach short notes in systemic pathology?", status: "pending", response: "" },
];

const INITIAL_MARK_ENTRIES = [];

const TABS = [
  { id: "students", label: "Students" },
  { id: "subjects", label: "Subjects" },
  { id: "rankings", label: "Rankings" },
  { id: "weak", label: "Weak Students" },
  { id: "analytics", label: "Analytics" },
  { id: "queries", label: "Queries" },
  { id: "marks", label: "Marks Entry" },
];

const PAGE_SIZE = 10;

const scoreClass = (score) => {
  if (score >= 85) return "score-green";
  if (score >= 75) return "score-blue";
  if (score >= 60) return "score-yellow";
  if (score >= 50) return "score-orange";
  return "score-red";
};

const normalizeUsnKey = (value) => {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return "";
  if (/^\d{4}MD\d+$/i.test(raw)) return raw;
  return raw.replace(/^\d{4}(?=[A-Z]{2,}\d+)/, "");
};

const rankBadgeClass = (rank) => {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  return "rank-plain";
};

const toAdminYearLabel = (value) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text.includes("year 1") || text === "1") return "Year 1";
  if (text.includes("year 2") || text === "2") return "Year 2";
  if (text.includes("year 3") || text === "3") return "Year 3";
  if (text.includes("year 4") || text.includes("final") || text === "4") return "Year 4";
  if (text === "2025") return "Year 1";
  if (text === "2024") return "Year 2";
  if (text === "2023") return "Year 3";
  if (text === "2022") return "Year 4";
  return String(value || "");
};

const yearNumberFromLabel = (value) => {
  const num = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : null;
};

const yearNumberFromSubjectCode = (subjectCode) => {
  const code = String(subjectCode || "").trim().toUpperCase();
  const match = code.match(/^[A-Z]+(\d{2,})/);
  if (!match) return null;
  const band = Number(match[1].slice(0, 2));
  if (band === 10) return 1;
  if (band === 20) return 2;
  if (band === 30) return 3;
  if (band === 40) return 4;
  return null;
};

const subjectBelongsToYear = (subjectRow, selectedYearLabel, department) => {
  if (!selectedYearLabel) return true;
  const selectedYearNum = yearNumberFromLabel(selectedYearLabel);
  if (!Number.isFinite(selectedYearNum)) return true;

  if (String(department || "").toUpperCase() === "MBBS") {
    const codeYear = yearNumberFromSubjectCode(subjectRow?.subject_code);
    if (Number.isFinite(codeYear)) return codeYear === selectedYearNum;
  }

  const semester = Number(subjectRow?.semester);
  if (Number.isFinite(semester) && semester > 0) {
    return Math.ceil(semester / 2) === selectedYearNum;
  }
  return true;
};

const isSubjectAllowedForYear = (subjectName, selectedYearLabel, department) => {
  if (!selectedYearLabel) return true;
  const name = String(subjectName || "").trim().toLowerCase();
  if (!name) return false;

  const dept = String(department || "").toUpperCase();
  const allowed = dept === "MD"
    ? MD_YEAR_SUBJECTS[selectedYearLabel]
    : MBBS_YEAR_SUBJECTS[selectedYearLabel];

  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  return allowed.some((subject) => String(subject).trim().toLowerCase() === name);
};

const normalizeDepartment = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "MBBS" || normalized === "MD") return normalized;
  return "";
};

const yearFromMdRollPrefix = (roll) => {
  const normalizedRoll = String(roll || "").trim().toUpperCase();
  if (normalizedRoll.startsWith("2024MD")) return "Year 2";
  if (normalizedRoll.startsWith("2025MD")) return "Year 1";
  return "";
};

const resolveStudentYearLabel = (row, fallbackDepartment = "") => {
  const department = normalizeDepartment(row?.department) || normalizeDepartment(fallbackDepartment);
  if (department === "MD") {
    const yearFromRoll = yearFromMdRollPrefix(row?.usn || row?.roll);
    if (yearFromRoll) return yearFromRoll;
  }
  return toAdminYearLabel(row?.year_label) || semesterToYearLabel(row?.semester) || toAdminYearLabel(row?.year) || "Year 1";
};

const semesterToYearLabel = (semesterValue) => {
  const semester = Number(semesterValue);
  if (!Number.isFinite(semester) || semester <= 0) return "";
  return `Year ${Math.ceil(semester / 2)}`;
};

const parseFiniteNumber = (value) => {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "string" && value.trim() === "") return NaN;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const aggregatePercentagesByGroup = (rows, getGroupKey, examMetaById) => {
  const grouped = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = getGroupKey(row);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  const out = new Map();
  for (const [key, groupRows] of grouped.entries()) {
    const percentage = computeSubjectPercentageFromExamRows(groupRows, examMetaById);
    if (Number.isFinite(percentage)) out.set(key, percentage);
  }
  return out;
};

const aggregateSubjectStatsByGroup = (rows, getGroupKey, examMetaById) => {
  const grouped = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = getGroupKey(row);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });

  const out = new Map();
  for (const [key, groupRows] of grouped.entries()) {
    const totals = computeSubjectTotalsFromExamRows(groupRows, examMetaById);
    if (totals) out.set(key, totals);
  }
  return out;
};

const computePercentileScore = (candidateScore, scores) => {
  const safeScores = (Array.isArray(scores) ? scores : []).filter(Number.isFinite);
  if (!Number.isFinite(candidateScore) || safeScores.length === 0) return NaN;
  const lessThanOrEqualCount = safeScores.filter((score) => score <= candidateScore).length;
  return Number(((lessThanOrEqualCount / safeScores.length) * 100).toFixed(2));
};

const buildSubjectPercentileLookup = ({ subjectNames, studentIds, statsByStudentIdAndName }) => {
  const lookup = new Map();

  (Array.isArray(subjectNames) ? subjectNames : []).forEach((subjectName) => {
    const scores = (Array.isArray(studentIds) ? studentIds : [])
      .map((studentId) => Number(statsByStudentIdAndName.get(`${studentId}__${subjectName}`)?.obtained))
      .filter(Number.isFinite);

    (Array.isArray(studentIds) ? studentIds : []).forEach((studentId) => {
      const candidateScore = Number(statsByStudentIdAndName.get(`${studentId}__${subjectName}`)?.obtained);
      const percentile = computePercentileScore(candidateScore, scores);
      if (Number.isFinite(percentile)) lookup.set(`${studentId}__${subjectName}`, percentile);
    });
  });

  return lookup;
};

const PERCENTILE_EXAM_WEIGHTS = {
  "Internal 1": 0.2,
  "Internal 2": 0.2,
  Midterm: 0.25,
  "Final Exam": 0.35,
};

const toSubjectKey = (subjectName) => {
  const key = String(subjectName || "").trim().toLowerCase();
  if (!key) return "";

  if (key.includes("anatomy")) return "anatomy";
  if (key.includes("physiology")) return "physiology";
  if (key.includes("biochem")) return "biochemistry";
  if (key.includes("pathology")) return "pathology";
  if (key.includes("pharmacology")) return "pharmacology";
  if (key.includes("microbiology")) return "microbiology";
  if (key.includes("forensic")) return "forensicMedicine";
  if (key.includes("community")) return "communityMedicine";
  if (key.includes("ophthalmology")) return "ophthalmology";
  if (key === "ent" || key.includes("ear nose")) return "ent";
  if (key.includes("medicine")) return "generalMedicine";
  if (key.includes("surgery")) return "generalSurgery";
  if (key === "obg" || key.includes("obstetric") || key.includes("gyne")) return "obg";
  if (key.includes("diagnostic")) return "generalSurgery";
  if (key.includes("critical care")) return "generalMedicine";
  if (key.includes("research") || key.includes("ethics") || key.includes("management") || key.includes("thesis")) return "generalMedicine";

  return SUBJECTS.find((subject) => subject.label.toLowerCase() === key)?.key || "";
};

const subjectShortLabel = (subjectName) => {
  const value = String(subjectName || "").trim();
  if (!value) return "";
  if (value.length <= 12) return value;
  return value.split(" ").map((part) => part[0]).join("").slice(0, 8).toUpperCase();
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const createSimplePdfBlob = (lines) => {
  const safeLines = Array.isArray(lines) ? lines : [];
  const pageWidth = 595;
  const pageHeight = 842;
  const fontSize = 11;
  const lineHeight = 14;
  const left = 40;
  const top = 800;
  const maxLines = Math.max(1, Math.floor((pageHeight - 80) / lineHeight));
  const pageChunks = [];

  for (let index = 0; index < safeLines.length; index += maxLines) {
    pageChunks.push(safeLines.slice(index, index + maxLines));
  }
  if (pageChunks.length === 0) pageChunks.push(["Report"]);

  const objects = [];
  const pageIds = [];
  let nextId = 4;

  pageChunks.forEach((chunk) => {
    const contentId = nextId++;
    const pageId = nextId++;
    const stream = [
      "BT",
      `/F1 ${fontSize} Tf`,
      `${left} ${top} Td`,
      ...chunk.flatMap((line, lineIndex) => {
        const escaped = escapePdfText(line);
        return lineIndex === 0 ? [`(${escaped}) Tj`] : [`0 -${lineHeight} Td`, `(${escaped}) Tj`];
      }),
      "ET",
    ].join("\n");
    objects.push(`${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
    objects.push(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj`);
    pageIds.push(pageId);
  });

  const orderedObjects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    `2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>\nendobj`,
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    ...objects,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  orderedObjects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${orderedObjects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${orderedObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

const downloadBlob = (filename, blob) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const normalizeExamName = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withoutPrefix = raw.replace(/^(MBBS|MD)\s+/i, "").trim();
  const compact = withoutPrefix.toLowerCase().replace(/\s+/g, " ");
  if (compact === "internal 1") return "Internal 1";
  if (compact === "internal 2") return "Internal 2";
  if (compact === "mid term" || compact === "midterm") return "Midterm";
  if (compact === "final" || compact === "final exam") return "Final Exam";
  return withoutPrefix;
};

function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("students");
  const [staffProfile, setStaffProfile] = useState({ name: "Staff", staffId: "", department: "" });
  const [studentsData, setStudentsData] = useState([]);
  const [assignedStudentsData, setAssignedStudentsData] = useState([]);
  const [assignedSubjectsData, setAssignedSubjectsData] = useState([]);
  const [assignedMarksData, setAssignedMarksData] = useState([]);
  const [examMetaById, setExamMetaById] = useState({});
  const [staffDepartment, setStaffDepartment] = useState("MBBS");
  const activeDepartment = normalizeDepartment(staffProfile.department) || staffDepartment;
  const departmentExams = useMemo(() => {
    const namesFromMarks = Array.from(
      new Set(
        (Array.isArray(assignedMarksData) ? assignedMarksData : [])
          .filter((row) => !activeDepartment || normalizeDepartment(row.department) === activeDepartment)
          .map((row) => normalizeExamName(row.exam_name))
          .filter(Boolean)
      )
    );
    if (namesFromMarks.length > 0) return namesFromMarks;
    return (EXAMS_BY_DEPARTMENT[activeDepartment] || []).map((exam) => normalizeExamName(exam));
  }, [activeDepartment, assignedMarksData]);
  const [selectedExam, setSelectedExam] = useState(departmentExams[0] || "");
  const yearOptions = useMemo(
    () => {
      const yearSet = new Set(
        assignedStudentsData
          .map((student) => toAdminYearLabel(student.year))
          .filter(Boolean)
      );

      // Keep year labels consistent with Admin dashboard filters.
      if (activeDepartment === "MBBS") {
        yearSet.add("Year 1");
        yearSet.add("Year 2");
        yearSet.add("Year 3");
        yearSet.add("Year 4");
      } else if (activeDepartment === "MD" && yearSet.size === 0) {
        yearSet.add("Year 1");
        yearSet.add("Year 2");
      }
      return [...yearSet].sort((a, b) => {
        const aNum = Number(String(a).replace(/\D/g, ""));
        const bNum = Number(String(b).replace(/\D/g, ""));
        if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) return String(a).localeCompare(String(b));
        return aNum - bNum;
      });
    },
    [activeDepartment, assignedStudentsData]
  );
  const yearOptionsFromMarks = useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(assignedMarksData) ? assignedMarksData : [])
            .filter((row) => !activeDepartment || normalizeDepartment(row.department) === activeDepartment)
            .map((row) => toAdminYearLabel(row.year))
            .filter(Boolean)
        )
      ).sort((a, b) => {
        const aNum = Number(String(a).replace(/\D/g, ""));
        const bNum = Number(String(b).replace(/\D/g, ""));
        if (!Number.isFinite(aNum) || !Number.isFinite(bNum)) return String(a).localeCompare(String(b));
        return aNum - bNum;
      }),
    [activeDepartment, assignedMarksData]
  );
  const [selectedYear, setSelectedYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("rank");
  const [sortDirection, setSortDirection] = useState("asc");
  const [api75Only, setApi75Only] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [queryFilter, setQueryFilter] = useState("all");
  const [queries, setQueries] = useState(INITIAL_QUERIES);
  const [queryReplies, setQueryReplies] = useState({});
  const [marksMode, setMarksMode] = useState("manual");
  const [markForm, setMarkForm] = useState({ subject: "", roll: "", marks: "" });
  const [recentEntries, setRecentEntries] = useState(INITIAL_MARK_ENTRIES);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [toast, setToast] = useState("");
  const [yearStaffContacts, setYearStaffContacts] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();

    const withAuth = (path) => {
      const separator = path.includes("?") ? "&" : "?";
      const url = `http://localhost:5000${path}${separator}_ts=${Date.now()}`;
      return fetch(url, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
    };

    const applyFallbackDepartment = () => {
      const fromStorage = normalizeDepartment(getStaffDepartment());
      if (fromStorage) {
        setStaffDepartment(fromStorage);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const fromQuery = normalizeDepartment(params.get("department"));
      if (fromQuery) setStaffDepartment(fromQuery);
    };

    const loadDashboardData = async () => {
      if (!token) {
        setStudentsData([]);
        setAssignedStudentsData([]);
        setAssignedMarksData([]);
        setAssignedSubjectsData([]);
        setExamMetaById({});
        applyFallbackDepartment();
        return;
      }

      try {
        const [profileRes, studentsRes, marksRes, subjectsRes, examsRes] = await Promise.all([
          withAuth("/api/staff/me/profile"),
          withAuth("/api/staff/me/students"),
          withAuth("/api/staff/me/marks"),
          withAuth("/api/staff/me/subjects"),
          withAuth("/api/exams"),
        ]);

        if (!studentsRes.ok) {
          if (!cancelled) {
            setStudentsData([]);
            setAssignedStudentsData([]);
            setAssignedMarksData([]);
            setAssignedSubjectsData([]);
            setExamMetaById({});
            applyFallbackDepartment();
          }
          return;
        }

        const [assignedStudents, assignedSubjects, profile] = await Promise.all([
          studentsRes.json(),
          subjectsRes.ok ? subjectsRes.json() : [],
          profileRes.ok ? profileRes.json() : Promise.resolve({}),
        ]);

        if (cancelled) return;

        const resolvedDepartment =
          normalizeDepartment(profile?.department) ||
          normalizeDepartment(Array.isArray(assignedStudents) ? assignedStudents[0]?.department : "");
        setStaffProfile({
          name: String(profile?.name || "Staff"),
          staffId: String(profile?.staff_id || ""),
          department: normalizeDepartment(profile?.department) || resolvedDepartment,
        });
        if (resolvedDepartment) setStaffDepartment(resolvedDepartment);
        setAssignedStudentsData(
          (Array.isArray(assignedStudents) ? assignedStudents : []).map((row) => ({
            department: normalizeDepartment(row.department) || resolvedDepartment || "MBBS",
            year: resolveStudentYearLabel(row, resolvedDepartment || "MBBS"),
          }))
        );
        setAssignedSubjectsData(Array.isArray(assignedSubjects) ? assignedSubjects : []);
        let meta = {};
        if (examsRes.ok) {
          const exams = await examsRes.json();
          meta = (Array.isArray(exams) ? exams : []).reduce((acc, exam) => {
            const id = Number(exam.id);
            const maxMarks = Number(exam.max_marks);
            if (!Number.isFinite(id)) return acc;
            acc[id] = {
              exam_name: String(exam.exam_name || "").trim(),
              max_marks: Number.isFinite(maxMarks) ? maxMarks : NaN,
            };
            return acc;
          }, {});
          setExamMetaById(meta);
        } else {
          setExamMetaById({});
        }

        const marksByUsn = {};
        const marksByUsnBySubjectName = {};
        let marksRows = [];
        if (marksRes.ok) {
          const assignedMarks = await marksRes.json();
          marksRows = Array.isArray(assignedMarks) ? assignedMarks : [];
        } else {
          const subjectsRes = await withAuth("/api/staff/me/subjects");
          if (subjectsRes.ok) {
            const assignedSubjects = await subjectsRes.json();
            const reports = await Promise.all(
              (Array.isArray(assignedSubjects) ? assignedSubjects : []).map(async (subject) => {
                const reportRes = await withAuth(`/api/staff/subjects/${subject.subject_id}/report`);
                if (!reportRes.ok) return [];
                const rows = await reportRes.json();
                return Array.isArray(rows)
                  ? rows.map((row) => ({ ...row, subject_name: subject.subject_name }))
                  : [];
              })
            );
            marksRows = reports.flat();
          }
        }

        const assignedStudentByUsn = new Map(
          (Array.isArray(assignedStudents) ? assignedStudents : []).map((row) => [normalizeUsnKey(row.usn), row])
        );

        const normalizedMarksRows = marksRows.map((row) => {
          const usn = String(row.usn || "").trim();
          const usnKey = normalizeUsnKey(usn);
          const studentMeta = assignedStudentByUsn.get(usnKey);
          const department = normalizeDepartment(row.department) || normalizeDepartment(studentMeta?.department) || resolvedDepartment || "MBBS";
          const year = toAdminYearLabel(
            resolveStudentYearLabel(
              {
                ...row,
                usn,
                year_label: row.year_label || studentMeta?.year_label,
                semester: row.semester ?? studentMeta?.semester,
                year: row.year || studentMeta?.year,
                department: row.department || studentMeta?.department || resolvedDepartment,
              },
              resolvedDepartment
            )
          );
          return {
            ...row,
            usn,
            usnKey,
            department,
            year,
          };
        });
        setAssignedMarksData(normalizedMarksRows);
        setRecentEntries(
          [...normalizedMarksRows]
            .reverse()
            .slice(0, 30)
            .map((row) => ({
              id: Number(row.id) || Date.now() + Math.random(),
              roll: String(row.usn || "").trim(),
              subject: String(row.subject_name || "").trim(),
              marks: (() => {
                const raw = parseFiniteNumber(row.marks_obtained);
                const normalized = parseFiniteNumber(row.normalized_score);
                const value = Number.isFinite(raw) ? raw : normalized;
                return Number.isFinite(value) ? Number(value.toFixed(1)) : NaN;
              })(),
            }))
            .filter((entry) => entry.roll && entry.subject && Number.isFinite(entry.marks))
        );

        const scoreByUsnAndKey = aggregatePercentagesByGroup(
          normalizedMarksRows,
          (row) => {
            const usn = normalizeUsnKey(row.usnKey || row.usn);
            const subjectKey = toSubjectKey(row.subject_name);
            if (!usn || !subjectKey) return "";
            return `${usn}__${subjectKey}`;
          },
          meta
        );
        const scoreByUsnAndName = aggregatePercentagesByGroup(
          normalizedMarksRows,
          (row) => {
            const usn = normalizeUsnKey(row.usnKey || row.usn);
            const subjectName = String(row.subject_name || "").trim();
            if (!usn || !subjectName) return "";
            return `${usn}__${subjectName}`;
          },
          meta
        );

        for (const [mapKey, score] of scoreByUsnAndKey.entries()) {
          const [usn, subjectKey] = mapKey.split("__");
          if (!marksByUsn[usn]) marksByUsn[usn] = {};
          marksByUsn[usn][subjectKey] = [score];
        }
        for (const [mapKey, score] of scoreByUsnAndName.entries()) {
          const [usn, subjectName] = mapKey.split("__");
          if (!marksByUsnBySubjectName[usn]) marksByUsnBySubjectName[usn] = {};
          marksByUsnBySubjectName[usn][subjectName] = [score];
        }

        const builtStudents = (Array.isArray(assignedStudents) ? assignedStudents : []).map((row) => {
          const roll = String(row.usn || "").trim();
          const rollKey = normalizeUsnKey(roll);
          const yearLabel = resolveStudentYearLabel({ ...row, usn: roll }, resolvedDepartment);
          const subjectScores = {};
          SUBJECTS.forEach(({ key }) => {
            const values = marksByUsn[rollKey]?.[key] || [];
            subjectScores[key] = values.length
              ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
              : 0;
          });

          const subjectScoresByName = Object.entries(marksByUsnBySubjectName[rollKey] || {}).reduce(
            (acc, [subjectName, values]) => {
              if (!Array.isArray(values) || values.length === 0) return acc;
              const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
              acc[subjectName] = Number(avg.toFixed(1));
              return acc;
            },
            {}
          );

          return {
            id: Number(row.id),
            roll,
            rollKey,
            year: yearLabel,
            department: normalizeDepartment(row.department) || resolvedDepartment || "MBBS",
            name: String(row.name || "").trim(),
            subjectScoresByName,
            ...subjectScores,
          };
        });

        if (builtStudents.length > 0) {
          setStudentsData(builtStudents);
        } else {
          setStudentsData([]);
        }
      } catch {
        if (!cancelled) {
          setStudentsData([]);
          setAssignedStudentsData([]);
          setAssignedMarksData([]);
          setAssignedSubjectsData([]);
          setExamMetaById({});
          setRecentEntries([]);
          applyFallbackDepartment();
        }
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedExam((prev) => (departmentExams.includes(prev) ? prev : departmentExams[0] || ""));
  }, [departmentExams]);

  useEffect(() => {
    const preferredYears = yearOptionsFromMarks.length > 0 ? yearOptionsFromMarks : yearOptions;
    setSelectedYear((prev) => (preferredYears.includes(prev) ? prev : preferredYears[0] || ""));
  }, [activeDepartment, yearOptions, yearOptionsFromMarks]);

  useEffect(() => {
    const examOptionsForCurrentYear = Array.from(
      new Set(
        (Array.isArray(assignedMarksData) ? assignedMarksData : [])
          .filter((row) => {
            if (activeDepartment && normalizeDepartment(row.department) !== activeDepartment) return false;
            if (selectedYear && toAdminYearLabel(row.year) !== selectedYear) return false;
            return true;
          })
          .map((row) => normalizeExamName(row.exam_name))
          .filter(Boolean)
      )
    );

    if (examOptionsForCurrentYear.length === 0) {
      if (departmentExams.includes(selectedExam)) return;
      setSelectedExam(departmentExams[0] || "");
      return;
    }

    if (!examOptionsForCurrentYear.includes(selectedExam)) {
      setSelectedExam(examOptionsForCurrentYear[0]);
    }
  }, [activeDepartment, assignedMarksData, departmentExams, selectedExam, selectedYear]);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token || !selectedYear || !activeDepartment) {
      setYearStaffContacts([]);
      return () => {
        cancelled = true;
      };
    }

    const loadYearContacts = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/staff/me/year-staff?year=${encodeURIComponent(selectedYear)}&_ts=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );
        if (!res.ok) {
          if (!cancelled) setYearStaffContacts([]);
          return;
        }
        const rows = await res.json();
        if (cancelled) return;
        const currentStaffId = Number(staffProfile.staffId);
        const filtered = (Array.isArray(rows) ? rows : []).filter((row) => {
          const rowStaffId = Number(row.staff_id);
          if (!Number.isFinite(currentStaffId)) return true;
          return rowStaffId !== currentStaffId;
        });
        setYearStaffContacts(filtered);
      } catch {
        if (!cancelled) setYearStaffContacts([]);
      }
    };

    loadYearContacts();
    return () => {
      cancelled = true;
    };
  }, [activeDepartment, selectedYear, staffProfile.staffId]);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();
    if (!token) {
      setQueries([]);
      return () => {
        cancelled = true;
      };
    }

    const loadQueries = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/staff/me/queries?_ts=${Date.now()}`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) {
          if (!cancelled) setQueries([]);
          return;
        }
        const rows = await res.json();
        if (cancelled) return;
        setQueries(
          (Array.isArray(rows) ? rows : []).map((row) => ({
            id: Number(row.id),
            studentName: String(row.student_name || "Student"),
            roll: String(row.student_roll || ""),
            subject: String(row.subject || ""),
            date: row.created_at ? new Date(row.created_at).toLocaleDateString() : "",
            question: String(row.question || ""),
            status: String(row.status || "pending"),
            response: String(row.response || ""),
          }))
        );
      } catch {
        if (!cancelled) setQueries([]);
      }
    };

    loadQueries();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasRowsForSelectedExam = useMemo(
    () =>
      (Array.isArray(assignedMarksData) ? assignedMarksData : []).some((row) => {
        if (activeDepartment && normalizeDepartment(row.department) !== activeDepartment) return false;
        if (selectedYear && !subjectBelongsToYear(row, selectedYear, activeDepartment)) return false;
        if (!selectedExam) return false;
        return normalizeExamName(row.exam_name) === selectedExam;
      }),
    [activeDepartment, assignedMarksData, selectedExam, selectedYear]
  );
  const effectiveSelectedExam = hasRowsForSelectedExam ? selectedExam : "";
  const directSubjectStatsLookup = useMemo(() => {
    const filteredRows = (Array.isArray(assignedMarksData) ? assignedMarksData : []).filter((row) => {
      const rowDepartment = normalizeDepartment(row.department);
      if (activeDepartment && rowDepartment && rowDepartment !== activeDepartment) return false;
      if (selectedYear && !subjectBelongsToYear(row, selectedYear, activeDepartment)) return false;
      if (selectedYear && !isSubjectAllowedForYear(row.subject_name, selectedYear, activeDepartment)) return false;
      if (effectiveSelectedExam && normalizeExamName(row.exam_name) !== effectiveSelectedExam) return false;
      return true;
    });

    return aggregateSubjectStatsByGroup(
      filteredRows,
      (row) => {
        const studentId = Number(row.student_id);
        const subjectName = String(row.subject_name || "").trim().toLowerCase();
        if (!Number.isFinite(studentId) || !subjectName) return "";
        return `${studentId}__${subjectName}`;
      },
      examMetaById
    );
  }, [activeDepartment, assignedMarksData, effectiveSelectedExam, examMetaById, selectedYear]);

  const getStudentSubjectPercentage = useCallback((student, subjectName) => {
    const studentId = Number(student?.id);
    const subjectKey = String(subjectName || "").trim().toLowerCase();
    const direct = directSubjectStatsLookup.get(`${studentId}__${subjectKey}`);
    if (direct && Number.isFinite(direct.percentage)) return direct.percentage;

    const byName = Number(student?.subjectScoresByName?.[subjectName]);
    if (Number.isFinite(byName)) return byName;
    const mappedKey = toSubjectKey(subjectName);
    const mappedValue = Number(student?.[mappedKey]);
    if (Number.isFinite(mappedValue)) return mappedValue;
    return 0;
  }, [directSubjectStatsLookup]);

  const getStudentSubjectRawTotals = useCallback((student, subjectName) => {
    const studentId = Number(student?.id);
    const subjectKey = String(subjectName || "").trim().toLowerCase();
    const direct = directSubjectStatsLookup.get(`${studentId}__${subjectKey}`);
    if (direct) return direct;
    return null;
  }, [directSubjectStatsLookup]);
  const subjectNamesForYear = useMemo(() => {
    const allowedForYear = activeDepartment === "MD"
      ? MD_YEAR_SUBJECTS[selectedYear] || MD_TABLE_SUBJECTS
      : MBBS_YEAR_SUBJECTS[selectedYear] || MBBS_TABLE_SUBJECTS;
    // For a selected year, always use the fixed year-wise syllabus subjects
    // so MBBS Year 1 consistently shows Anatomy, Physiology, Biochemistry.
    return allowedForYear;
  }, [activeDepartment, selectedYear]);

  const studentsWithApi = useMemo(() => {
    const allScopedRows = (Array.isArray(assignedMarksData) ? assignedMarksData : []).filter((row) => {
      const rowDepartment = normalizeDepartment(row.department);
      if (activeDepartment && rowDepartment && rowDepartment !== activeDepartment) return false;
      if (selectedYear && !subjectBelongsToYear(row, selectedYear, activeDepartment)) return false;
      if (selectedYear && !isSubjectAllowedForYear(row.subject_name, selectedYear, activeDepartment)) return false;
      return true;
    });
    const filteredRows = effectiveSelectedExam
      ? allScopedRows.filter((row) => normalizeExamName(row.exam_name) === effectiveSelectedExam)
      : allScopedRows;

    const statsByStudentIdAndName = aggregateSubjectStatsByGroup(
      filteredRows,
      (row) => {
        const studentId = Number(row.student_id);
        const subjectName = String(row.subject_name || "").trim();
        if (!Number.isFinite(studentId) || !subjectName) return "";
        return `${studentId}__${subjectName}`;
      },
      examMetaById
    );

    const eligibleStudents = studentsData.filter((student) => {
      if (activeDepartment && student.department !== activeDepartment) return false;
      if (selectedYear && toAdminYearLabel(student.year) !== selectedYear) return false;
      return true;
    });
    const eligibleStudentIds = eligibleStudents.map((student) => Number(student.id)).filter(Number.isFinite);
    const subjectPercentileLookup = buildSubjectPercentileLookup({
      subjectNames: subjectNamesForYear,
      studentIds: eligibleStudentIds,
      statsByStudentIdAndName,
    });
    const weightedExamPercentilesByStudentId = new Map();

    if (!effectiveSelectedExam) {
      Object.entries(PERCENTILE_EXAM_WEIGHTS).forEach(([examName]) => {
        const examRows = allScopedRows.filter((row) => normalizeExamName(row.exam_name) === examName);
        const examStatsByStudentIdAndName = aggregateSubjectStatsByGroup(
          examRows,
          (row) => {
            const studentId = Number(row.student_id);
            const subjectName = String(row.subject_name || "").trim();
            if (!Number.isFinite(studentId) || !subjectName) return "";
            return `${studentId}__${subjectName}`;
          },
          examMetaById
        );
        const examSubjectPercentiles = buildSubjectPercentileLookup({
          subjectNames: subjectNamesForYear,
          studentIds: eligibleStudentIds,
          statsByStudentIdAndName: examStatsByStudentIdAndName,
        });

        eligibleStudentIds.forEach((studentId) => {
          const subjectPercentiles = subjectNamesForYear
            .map((subjectName) => Number(examSubjectPercentiles.get(`${studentId}__${subjectName}`)))
            .filter(Number.isFinite);
          if (subjectPercentiles.length === 0) return;
          const examPercentile = subjectPercentiles.reduce((sum, value) => sum + value, 0) / subjectPercentiles.length;
          if (!weightedExamPercentilesByStudentId.has(studentId)) weightedExamPercentilesByStudentId.set(studentId, {});
          weightedExamPercentilesByStudentId.get(studentId)[examName] = examPercentile;
        });
      });
    }

    const computed = studentsData.map((student) => {
      const studentId = Number(student.id);
      const subjectScores = {};
      SUBJECTS.forEach(({ key }) => {
        const subjectName = SUBJECTS.find((subject) => subject.key === key)?.label || "";
        const value = Number(subjectPercentileLookup.get(`${studentId}__${subjectName}`));
        subjectScores[key] = Number.isFinite(value) ? Number(value.toFixed(1)) : 0;
      });

      const subjectScoresByName = {};
      for (const subjectName of subjectNamesForYear) {
        const value = Number(subjectPercentileLookup.get(`${studentId}__${subjectName}`));
        if (Number.isFinite(value)) subjectScoresByName[subjectName] = Number(value.toFixed(1));
      }

      const apiSubjects = subjectNamesForYear.length > 0
        ? subjectNamesForYear
        : SUBJECTS.map((subject) => subject.label);
      const total = apiSubjects.reduce((sum, subjectName) => {
        const byName = Number(subjectScoresByName[subjectName]);
        if (Number.isFinite(byName)) return sum + byName;
        const mappedKey = toSubjectKey(subjectName);
        const mappedValue = Number(subjectScores[mappedKey]);
        if (Number.isFinite(mappedValue)) return sum + mappedValue;
        return sum;
      }, 0);
      const examPercentiles = weightedExamPercentilesByStudentId.get(studentId) || {};
      const weightedApi = Object.entries(PERCENTILE_EXAM_WEIGHTS).reduce((sum, [examName, weight]) => {
        const score = Number(examPercentiles[examName]);
        return Number.isFinite(score) ? sum + (score * weight) : sum;
      }, 0);
      return {
        ...student,
        ...subjectScores,
        subjectScoresByName,
        api: Number((effectiveSelectedExam ? total / Math.max(apiSubjects.length, 1) : weightedApi).toFixed(1)),
        examPercentiles,
      };
    });

    const ranked = [...computed].sort((a, b) => b.api - a.api);
    const rankMap = new Map(ranked.map((item, index) => [item.roll, index + 1]));
    return computed.map((student) => ({ ...student, rank: rankMap.get(student.roll) }));
  }, [activeDepartment, assignedMarksData, assignedSubjectsData, effectiveSelectedExam, examMetaById, selectedYear, studentsData, subjectNamesForYear]);

  const contextStudents = useMemo(
    () =>
      studentsWithApi.filter(
        (student) =>
          !selectedYear || toAdminYearLabel(student.year) === selectedYear
      ),
    [studentsWithApi, selectedYear]
  );

  const tableSubjects = useMemo(() => subjectNamesForYear, [subjectNamesForYear]);

  const overviewStats = useMemo(() => {
    const apis = contextStudents.map((s) => s.api);
    const totalStudents = contextStudents.length;
    if (totalStudents === 0) {
      return { totalStudents: 0, classAverage: 0, highest: 0, lowest: 0, passPercentage: 0 };
    }
    const classAverage = Number((apis.reduce((sum, api) => sum + api, 0) / totalStudents).toFixed(1));
    const highest = Math.max(...apis);
    const lowest = Math.min(...apis);
    const passCount = contextStudents.filter((student) => student.api >= 50).length;
    const passPercentage = Number(((passCount / totalStudents) * 100).toFixed(1));
    return { totalStudents, classAverage, highest, lowest, passPercentage };
  }, [contextStudents]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const base = contextStudents.filter((student) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.roll.toLowerCase().includes(normalizedSearch);
      return matchesSearch && (api75Only ? student.api > 75 : true);
    });

    return [...base].sort((a, b) => {
      if (String(sortColumn).startsWith("subject:")) {
        const subjectName = String(sortColumn).replace("subject:", "");
        const colA = Number(getStudentSubjectRawTotals(a, subjectName)?.obtained ?? 0);
        const colB = Number(getStudentSubjectRawTotals(b, subjectName)?.obtained ?? 0);
        return sortDirection === "asc" ? colA - colB : colB - colA;
      }
      const colA = a[sortColumn];
      const colB = b[sortColumn];
      if (typeof colA === "string" || typeof colB === "string") {
        return sortDirection === "asc"
          ? String(colA).localeCompare(String(colB))
          : String(colB).localeCompare(String(colA));
      }
      return sortDirection === "asc" ? colA - colB : colB - colA;
    });
  }, [contextStudents, searchTerm, api75Only, getStudentSubjectRawTotals, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const subjectCards = useMemo(() => {
    const contextStudentIdSet = new Set(
      contextStudents
        .map((student) => Number(student.id))
        .filter((id) => Number.isFinite(id))
    );

    const subjectNamesFromAssignments = (Array.isArray(assignedSubjectsData) ? assignedSubjectsData : [])
      .filter((subject) => subjectBelongsToYear(subject, selectedYear, activeDepartment))
      .map((subject) => String(subject.subject_name || "").trim())
      .filter(Boolean);
    const subjectNamesFromMarks = (Array.isArray(assignedMarksData) ? assignedMarksData : [])
      .filter((row) => contextStudentIdSet.has(Number(row.student_id)))
      .filter((row) => subjectBelongsToYear(row, selectedYear, activeDepartment))
      .filter((row) => isSubjectAllowedForYear(row.subject_name, selectedYear, activeDepartment))
      .map((row) => String(row.subject_name || "").trim())
      .filter(Boolean);

    let namesToUse = Array.from(new Set([...subjectNamesFromAssignments, ...subjectNamesFromMarks]));
    if (activeDepartment === "MD") {
      namesToUse = MD_YEAR_SUBJECTS[selectedYear] || MD_SUBJECTS;
    } else {
      namesToUse = MBBS_YEAR_SUBJECTS[selectedYear] || MBBS_TABLE_SUBJECTS;
    }

    return namesToUse.map((subjectName) => {
      const rows = (Array.isArray(assignedMarksData) ? assignedMarksData : []).filter((row) => {
        if (String(row.subject_name || "").trim().toLowerCase() !== subjectName.toLowerCase()) return false;
        if (!contextStudentIdSet.has(Number(row.student_id))) return false;
        if (selectedYear && toAdminYearLabel(row.year) !== selectedYear) return false;
        if (effectiveSelectedExam && normalizeExamName(row.exam_name) !== effectiveSelectedExam) return false;
        return true;
      });
      const scoresByStudent = aggregateSubjectStatsByGroup(
        rows,
        (row) => {
          const studentId = Number(row.student_id);
          return Number.isFinite(studentId) ? String(studentId) : "";
        },
        examMetaById
      );
      const studentAverages = Array.from(scoresByStudent.values())
        .map((item) => item?.percentage)
        .filter((value) => Number.isFinite(value));

      if (studentAverages.length === 0) {
        return {
          key: subjectName,
          label: subjectName,
          short: subjectShortLabel(subjectName),
          average: 0,
          highest: 0,
          lowest: 0,
          failed: 0,
          passPercentage: 0,
        };
      }

      const average = Number((studentAverages.reduce((sum, value) => sum + value, 0) / studentAverages.length).toFixed(1));
      const highest = Number(Math.max(...studentAverages).toFixed(1));
      const lowest = Number(Math.min(...studentAverages).toFixed(1));
      const failed = studentAverages.filter((score) => score < 50).length;
      const passPercentage = Number((((studentAverages.length - failed) / studentAverages.length) * 100).toFixed(1));

      return {
        key: subjectName,
        label: subjectName,
        short: subjectShortLabel(subjectName),
        average,
        highest,
        lowest,
        failed,
        passPercentage,
      };
    });
  }, [activeDepartment, assignedMarksData, assignedSubjectsData, contextStudents, effectiveSelectedExam, examMetaById, selectedYear, tableSubjects]);

  const topTen = useMemo(() => [...contextStudents].sort((a, b) => b.api - a.api).slice(0, 10), [contextStudents]);

  const weakStudentsContext = useMemo(() => {
    return contextStudents;
  }, [contextStudents]);

  const weakSegments = useMemo(() => {
    const activeSubjects = Array.isArray(tableSubjects) && tableSubjects.length > 0
      ? tableSubjects
      : SUBJECTS.map((subject) => subject.label);
    const withFailures = weakStudentsContext.map((student) => ({
      ...student,
      failedSubjects: activeSubjects.filter((subjectName) => {
        const byName = Number(student?.subjectScoresByName?.[subjectName]);
        if (Number.isFinite(byName)) return byName < 40;
        const mappedKey = toSubjectKey(subjectName);
        return Number(student?.[mappedKey] || 0) < 40;
      }),
    }));
    const criticalStudents = withFailures.filter(
      (student) => student.api < 40 || student.failedSubjects.length >= 3
    );
    return {
      critical: criticalStudents,
      multiple: withFailures.filter(
        (student) => student.failedSubjects.length >= 2 && !criticalStudents.some((critical) => critical.roll === student.roll)
      ),
      borderline: withFailures.filter((student) => student.api >= 40 && student.api <= 60),
    };
  }, [tableSubjects, weakStudentsContext]);

  const analytics = useMemo(() => {
    const barData = subjectCards.map((subject) => ({ name: subject.short, value: subject.average }));
    const gradeCounts = contextStudents.reduce(
      (acc, student) => {
        if (student.api >= 85) acc.A += 1;
        else if (student.api >= 75) acc.B += 1;
        else if (student.api >= 60) acc.C += 1;
        else if (student.api >= 50) acc.D += 1;
        else acc.F += 1;
        return acc;
      },
      { A: 0, B: 0, C: 0, D: 0, F: 0 }
    );

    const pieData = [
      { name: `A (>=85): ${gradeCounts.A}`, value: gradeCounts.A, color: "#1fb981" },
      { name: `B (75-84): ${gradeCounts.B}`, value: gradeCounts.B, color: "#417fe0" },
      { name: `C (60-74): ${gradeCounts.C}`, value: gradeCounts.C, color: "#ecb700" },
      { name: `D (50-59): ${gradeCounts.D}`, value: gradeCounts.D, color: "#ff7b12" },
      { name: `F (<50): ${gradeCounts.F}`, value: gradeCounts.F, color: "#f44747" },
    ];

    const ranges = [
      { range: "90-100", min: 90, max: 100 },
      { range: "80-89", min: 80, max: 89.99 },
      { range: "70-79", min: 70, max: 79.99 },
      { range: "60-69", min: 60, max: 69.99 },
      { range: "50-59", min: 50, max: 59.99 },
      { range: "<50", min: -Infinity, max: 49.99 },
    ];
    const lineData = ranges.map((bucket) => ({
      range: bucket.range,
      students: contextStudents.filter((student) => student.api >= bucket.min && student.api <= bucket.max).length,
    }));
    return { barData, pieData, lineData };
  }, [contextStudents, subjectCards]);

  const queryStats = useMemo(() => {
    const pending = queries.filter((query) => query.status === "pending").length;
    const answered = queries.length - pending;
    return { total: queries.length, pending, answered };
  }, [queries]);

  const visibleQueries = useMemo(() => {
    if (queryFilter === "all") return queries;
    return queries.filter((query) => query.status === queryFilter);
  }, [queries, queryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, api75Only]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const setSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection(column === "rank" ? "asc" : "desc");
  };

  const handleReplySubmit = (queryId) => {
    const text = (queryReplies[queryId] ?? "").trim();
    if (!text) {
      setToast("Please type a response before sending");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setToast("Login required");
      return;
    }
    const submit = async () => {
      const res = await fetch(`http://localhost:5000/api/staff/me/queries/${queryId}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response: text }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to send response");
      }
      setQueries((prev) => prev.map((query) => (query.id === queryId ? { ...query, status: "answered", response: text } : query)));
      setQueryReplies((prev) => ({ ...prev, [queryId]: "" }));
      setToast("Response sent successfully");
    };
    submit().catch((error) => setToast(error.message || "Failed to send response"));
  };

  const handleSaveMark = () => {
    const subject = markForm.subject.trim();
    const roll = markForm.roll.trim().toUpperCase();
    const marks = Number(markForm.marks);
    if (!subject || !roll || Number.isNaN(marks)) {
      setToast("Enter subject, roll number and marks");
      return;
    }
    const selectedExamId = Number(
      Object.keys(examMetaById).find((examId) => normalizeExamName(examMetaById[Number(examId)]?.exam_name) === selectedExam)
    );
    const selectedExamMax = Number(examMetaById[selectedExamId]?.max_marks);
    const maxAllowed = Number.isFinite(selectedExamMax) && selectedExamMax > 0 ? selectedExamMax : 100;
    if (marks < 0 || marks > maxAllowed) {
      setToast(`Marks must be between 0 and ${maxAllowed}`);
      return;
    }
    const enteredRollKey = normalizeUsnKey(roll);
    const studentRow = studentsWithApi.find((student) => normalizeUsnKey(student.rollKey || student.roll) === enteredRollKey);
    if (!studentRow || !studentRow.id) {
      setToast("Student not found among your assigned students");
      return;
    }

    const matchedSubject = (Array.isArray(assignedSubjectsData) ? assignedSubjectsData : []).find((row) => {
      if (String(row.subject_name || "").trim() !== subject) return false;
      return subjectBelongsToYear(row, selectedYear, activeDepartment);
    });
    if (!matchedSubject?.subject_id) {
      setToast("Subject is not assigned for selected year");
      return;
    }
    if (!Number.isFinite(selectedExamId)) {
      setToast("Selected exam not found");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setToast("Login required");
      return;
    }

    const submit = async () => {
      const res = await fetch("http://localhost:5000/api/staff/marks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: Number(studentRow.id),
          subject_id: Number(matchedSubject.subject_id),
          exam_id: selectedExamId,
          marks_obtained: marks,
        }),
      });
      if (!res.ok) {
        let message = "Failed to save marks";
        try {
          const payload = await res.json();
          if (payload?.message) message = payload.message;
        } catch {
          // Ignore parsing error.
        }
        throw new Error(message);
      }
      const saved = await res.json();
      setAssignedMarksData((prev) => [
        ...prev,
        {
          ...saved,
          usn: String(studentRow.roll || "").trim(),
          department: activeDepartment,
          year: selectedYear,
          subject_name: String(matchedSubject.subject_name || "").trim(),
          exam_name: selectedExam,
        },
      ]);
      if (editingEntryId) {
        setRecentEntries((prev) => prev.map((entry) => (entry.id === editingEntryId ? { ...entry, subject, roll, marks } : entry)));
        setEditingEntryId(null);
        setToast("Entry updated");
      } else {
        setRecentEntries((prev) => [{ id: Date.now(), subject, roll, marks: Number(marks.toFixed(1)) }, ...prev]);
        setToast("Marks saved to database");
      }
      setMarkForm({ subject: "", roll: "", marks: "" });
    };

    submit().catch((error) => {
      setToast(error.message || "Failed to save marks");
    });
  };

  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id);
    setMarkForm({ subject: entry.subject, roll: entry.roll, marks: String(entry.marks) });
    setMarksMode("manual");
  };

  const handleDeleteEntry = (entryId) => {
    setRecentEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    if (editingEntryId === entryId) {
      setEditingEntryId(null);
      setMarkForm({ subject: "", roll: "", marks: "" });
    }
    setToast("Entry deleted");
  };

  const handleChooseUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setToast(`Selected file: ${file.name}`);
  };

  const handleDownloadTemplate = () => {
    const content = "Roll Number,Student Name,Anatomy,Physiology,Biochemistry,Pathology,Microbiology,Forensic Medicine,Community Medicine,Ophthalmology,ENT,General Medicine,General Surgery,OBG";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "marks-template.csv";
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const reportMetaRows = (title) => ([
    ["Report", title],
    ["Generated At", new Date().toLocaleString()],
    ["Staff Name", staffProfile.name || "Staff"],
    ["Staff ID", staffProfile.staffId || "N/A"],
    ["Department", activeDepartment || "N/A"],
    ["Year", selectedYear || "All"],
    ["Exam", effectiveSelectedExam || selectedExam || "All"],
    [],
  ]);

  const buildStudentResultRow = (student) => {
    const marks = tableSubjects.map((subject) => getStudentSubjectPercentage(student, subject));
    const passed = marks.filter((mark) => mark >= 50).length;
    const failed = marks.length - passed;
    const result = failed === 0 ? "PASS" : "FAIL";
    return { marks, passed, failed, result };
  };

  const handleDownloadIndividualStudentReport = () => {
    const rows = [...reportMetaRows("Individual Student Report")];
    rows.push([
      "S.No",
      "Roll No",
      "Student Name",
      "Department",
      "Year",
      ...tableSubjects,
      "Passed Subjects",
      "Failed Subjects",
      "API",
      "Rank",
      "Result",
    ]);

    contextStudents.forEach((student, index) => {
      const details = buildStudentResultRow(student);
      rows.push([
        index + 1,
        student.roll,
        student.name,
        activeDepartment,
        selectedYear || toAdminYearLabel(student.year) || "N/A",
        ...details.marks.map((mark) => Number(mark).toFixed(1)),
        details.passed,
        details.failed,
        Number(student.api).toFixed(1),
        student.rank || "",
        details.result,
      ]);
    });

    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadCsv(`individual_student_report_${activeDepartment.toLowerCase()}_${yearPart}.csv`, rows);
    setToast("Individual student report downloaded");
  };

  const handleDownloadSubjectPerformanceReport = () => {
    const rows = [...reportMetaRows("Subject Performance Report")];
    rows.push([
      "S.No",
      "Subject",
      "Average Score",
      "Highest Score",
      "Lowest Score",
      "Failed Students",
      "Pass Percentage",
      "Total Students",
    ]);

    subjectCards.forEach((subject, index) => {
      rows.push([
        index + 1,
        subject.label,
        Number(subject.average).toFixed(1),
        Number(subject.highest).toFixed(1),
        Number(subject.lowest).toFixed(1),
        subject.failed,
        `${Number(subject.passPercentage).toFixed(1)}%`,
        contextStudents.length,
      ]);
    });

    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadCsv(`subject_performance_report_${activeDepartment.toLowerCase()}_${yearPart}.csv`, rows);
    setToast("Subject performance report downloaded");
  };

  const handleDownloadClassSummaryReport = () => {
    const gradeDistribution = analytics.pieData
      .map((bucket) => [bucket.name, bucket.value]);
    const topFive = [...topTen].slice(0, 5);
    const bottomFive = [...contextStudents].sort((a, b) => a.api - b.api).slice(0, 5);
    const rows = [...reportMetaRows("Class Summary Report")];

    rows.push(["Metric", "Value"]);
    rows.push(["Total Students", overviewStats.totalStudents]);
    rows.push(["Total Subjects", tableSubjects.length]);
    rows.push(["Class Average", `${Number(overviewStats.classAverage).toFixed(1)}%`]);
    rows.push(["Highest Score", `${Number(overviewStats.highest).toFixed(1)}%`]);
    rows.push(["Lowest Score", `${Number(overviewStats.lowest).toFixed(1)}%`]);
    rows.push(["Pass Percentage", `${Number(overviewStats.passPercentage).toFixed(1)}%`]);
    rows.push([]);
    rows.push(["Grade Distribution", "Count"]);
    gradeDistribution.forEach(([label, value]) => rows.push([label, value]));
    rows.push([]);
    rows.push(["Top 5 Students", "", "", ""]);
    rows.push(["Roll No", "Student Name", "API", "Rank"]);
    topFive.forEach((student) => {
      rows.push([student.roll, student.name, Number(student.api).toFixed(1), student.rank || ""]);
    });
    rows.push([]);
    rows.push(["Bottom 5 Students", "", "", ""]);
    rows.push(["Roll No", "Student Name", "API", "Rank"]);
    bottomFive.forEach((student) => {
      rows.push([student.roll, student.name, Number(student.api).toFixed(1), student.rank || ""]);
    });

    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadCsv(`class_summary_report_${activeDepartment.toLowerCase()}_${yearPart}.csv`, rows);
    setToast("Class summary report downloaded");
  };

  const handleDownloadSemesterResultReport = () => {
    const rows = [...reportMetaRows("Semester Result Report")];
    rows.push([
      "S.No",
      "Roll No",
      "Student Name",
      ...tableSubjects.map((subject) => `${subject} (Marks)`),
      ...tableSubjects.map((subject) => `${subject} (Status)`),
      "Total Passed",
      "Total Failed",
      "API",
      "Result",
    ]);

    contextStudents.forEach((student, index) => {
      const details = buildStudentResultRow(student);
      rows.push([
        index + 1,
        student.roll,
        student.name,
        ...details.marks.map((mark) => Number(mark).toFixed(1)),
        ...details.marks.map((mark) => (mark >= 50 ? "PASS" : "FAIL")),
        details.passed,
        details.failed,
        Number(student.api).toFixed(1),
        details.result,
      ]);
    });

    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadCsv(`semester_result_report_${activeDepartment.toLowerCase()}_${yearPart}.csv`, rows);
    setToast("Semester result report downloaded");
  };

  const getDashboardSummaryRows = () => {
    const rows = [...reportMetaRows("Staff Dashboard Summary Report")];
    rows.push(["Metric", "Value"]);
    rows.push(["Total Students", overviewStats.totalStudents]);
    rows.push(["Total Subjects", tableSubjects.length]);
    rows.push(["Class Average", `${Number(overviewStats.classAverage).toFixed(1)}%`]);
    rows.push(["Highest Score", `${Number(overviewStats.highest).toFixed(1)}%`]);
    rows.push(["Lowest Score", `${Number(overviewStats.lowest).toFixed(1)}%`]);
    rows.push(["Pass Percentage", `${Number(overviewStats.passPercentage).toFixed(1)}%`]);
    rows.push([]);
    rows.push(["Top 5 Students", "", "", ""]);
    rows.push(["Rank", "Roll No", "Student Name", "API"]);
    topTen.slice(0, 5).forEach((student) => {
      rows.push([student.rank || "", student.roll, student.name, Number(student.api).toFixed(2)]);
    });
    return rows;
  };

  const getMeritListRows = () => {
    const rows = [...reportMetaRows("Merit List Report")];
    rows.push(["Rank", "Roll No", "Student Name", "Department", "Year", "API Score"]);
    topTen.forEach((student, index) => {
      rows.push([
        student.rank || index + 1,
        student.roll,
        student.name,
        activeDepartment,
        selectedYear || toAdminYearLabel(student.year) || "N/A",
        Number(student.api).toFixed(2),
      ]);
    });
    return rows;
  };

  const rowsToPdfLines = (rows) =>
    rows.flatMap((row) => {
      if (!Array.isArray(row) || row.every((cell) => String(cell ?? "").trim() === "")) return [""];
      return [row.map((cell) => String(cell ?? "")).join(" | ")];
    });

  const downloadPdfReport = (filename, rows, successMessage) => {
    downloadBlob(filename, createSimplePdfBlob(rowsToPdfLines(rows)));
    setToast(successMessage);
  };

  const downloadExcelReport = (filename, sheetName, rows, successMessage) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, String(sheetName || "Report").slice(0, 31));
    const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      filename,
      new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );
    setToast(successMessage);
  };

  const handleGenerateReport = () => {
    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadPdfReport(
      `staff_dashboard_summary_${activeDepartment.toLowerCase()}_${yearPart}.pdf`,
      getDashboardSummaryRows(),
      "Summary report generated"
    );
  };

  const handleExportReport = () => {
    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadExcelReport(
      `staff_dashboard_summary_${activeDepartment.toLowerCase()}_${yearPart}.xlsx`,
      "Dashboard Summary",
      getDashboardSummaryRows(),
      "Summary report exported"
    );
  };

  const handleDownloadMeritPdf = () => {
    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadPdfReport(
      `merit_list_${activeDepartment.toLowerCase()}_${yearPart}.pdf`,
      getMeritListRows(),
      "Merit list PDF downloaded"
    );
  };

  const handleDownloadMeritExcel = () => {
    const yearPart = String(selectedYear || "all").replace(/\s+/g, "_").toLowerCase();
    downloadExcelReport(
      `merit_list_${activeDepartment.toLowerCase()}_${yearPart}.xlsx`,
      "Merit List",
      getMeritListRows(),
      "Merit list Excel downloaded"
    );
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/", { replace: true });
  };

  const quickReport = (
    <section className="sd-quick-report">
      <h3>Quick Report Generation</h3>
      <div className="sd-quick-grid">
        <button type="button" onClick={handleDownloadIndividualStudentReport}><FiFileText /> Individual Student Report</button>
        <button type="button" onClick={handleDownloadSubjectPerformanceReport}><FiFileText /> Subject Performance Report</button>
        <button type="button" onClick={handleDownloadClassSummaryReport}><FiFileText /> Class Summary Report</button>
        <button type="button" onClick={handleDownloadSemesterResultReport}><FiFileText /> Semester Result Report</button>
      </div>
    </section>
  );

  return (
    <div className="sd-root">
      <header className="sd-header">
        <div className="sd-header-inner">
          <div className="sd-header-left">
            <div className="sd-logo"><FiBook /></div>
            <div>
              <h1>Staff Dashboard - Academic Performance Normalizer</h1>
              <p><FiUser /> {staffProfile.name} Faculty ID: {staffProfile.staffId || "N/A"} ({activeDepartment})</p>
            </div>
          </div>
          <div className="sd-header-actions">
            <button type="button" onClick={handleGenerateReport}><FiFileText /> Generate Report</button>
            <button type="button" onClick={handleExportReport}><FiDownload /> Export</button>
            <button type="button" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="sd-container">
        <section className="sd-exam-card">
          <div className="sd-exam-left">
            <label htmlFor="examSelect">Select Exam:</label>
            <div className="sd-select-wrap">
              <select id="examSelect" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
                {departmentExams.map((exam) => <option key={exam} value={exam}>{exam}</option>)}
              </select>
              <FiChevronDown />
            </div>
            <label htmlFor="yearSelect">Select Year:</label>
            <div className="sd-select-wrap">
              <select id="yearSelect" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <FiChevronDown />
            </div>
          </div>
          <div className="sd-exam-right">
            <span className="sd-pill">{activeDepartment}</span>
            <span>{selectedYear || "N/A"}</span>
          </div>
        </section>

        <section className="sd-overview-grid">
          <article className="sd-stat-card"><div><h4>Total Students</h4><strong className="score-blue">{overviewStats.totalStudents}</strong></div><span className="sd-stat-icon icon-blue"><FiUsers /></span></article>
          <article className="sd-stat-card"><div><h4>Total Subjects</h4><strong className="score-purple">{tableSubjects.length}</strong></div><span className="sd-stat-icon icon-purple"><FiBook /></span></article>
          <article className="sd-stat-card"><div><h4>Class Average</h4><strong className="score-green">{overviewStats.classAverage}%</strong></div><span className="sd-stat-icon icon-green"><FiTrendingUp /></span></article>
          <article className="sd-stat-card"><div><h4>Highest Score</h4><strong className="score-orange">{overviewStats.highest}%</strong></div><span className="sd-stat-icon icon-yellow"><FiAward /></span></article>
          <article className="sd-stat-card"><div><h4>Lowest Score</h4><strong className="score-red">{overviewStats.lowest}%</strong></div><span className="sd-stat-icon icon-red"><FiTrendingDown /></span></article>
          <article className="sd-stat-card"><div><h4>Pass Percentage</h4><strong className="score-teal">{overviewStats.passPercentage}%</strong></div><span className="sd-stat-icon icon-teal"><FiCheckCircle /></span></article>
        </section>

        <nav className="sd-tabbar" aria-label="Staff Dashboard Tabs">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "students" && (
          <section className="sd-panel">
            <h2>Student Performance Table</h2>
            {contextStudents.length === 0 && selectedYear ? (
              <div className="sd-year-contact-box">
                <h3>No students assigned for {selectedYear}</h3>
                {yearStaffContacts.length > 0 ? (
                  <>
                    <p>Staff handling {activeDepartment} {selectedYear} students:</p>
                    <ul>
                      {yearStaffContacts.map((staff) => (
                        <li key={`${staff.staff_id}-${staff.staff_email}`}>
                          <strong>{staff.staff_name || `Staff ${staff.staff_id}`}</strong> - {staff.staff_email}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>No staff contact found for {activeDepartment} {selectedYear}.</p>
                )}
              </div>
            ) : null}
            <div className="sd-table-controls">
              <label className="sd-search"><FiSearch /><input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name or roll number..." /></label>
              <div className="sd-select-wrap sort-select">
                <select value={sortColumn} onChange={(e) => setSort(e.target.value)}>
                  <option value="rank">Rank</option><option value="api">API Score</option><option value="name">Name</option>
                  {tableSubjects.map((subject) => <option key={subject} value={`subject:${subject}`}>{subject}</option>)}
                </select>
                <FiChevronDown />
              </div>
              <button type="button" className={`sd-filter-button ${api75Only ? "active" : ""}`} onClick={() => setApi75Only((prev) => !prev)}><FiFilter /> API &gt; 75</button>
            </div>

            <div className="sd-table-wrap">
              <table className="sd-students-table">
                <thead>
                  <tr>
                    <th onClick={() => setSort("rank")}>Rank <span className="sd-sort-icon" aria-hidden="true">&#8597;</span></th><th onClick={() => setSort("roll")}>Roll No <span className="sd-sort-icon" aria-hidden="true">&#8597;</span></th><th onClick={() => setSort("name")}>Name <span className="sd-sort-icon" aria-hidden="true">&#8597;</span></th>{tableSubjects.map((subject) => (<th key={subject} onClick={() => setSort(`subject:${subject}`)}>{subject} <span className="sd-sort-icon" aria-hidden="true">&#8597;</span></th>))}<th onClick={() => setSort("api")}>API <span className="sd-sort-icon" aria-hidden="true">&#8597;</span></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => (
                    <tr key={student.roll}>
                      <td><span className={`sd-rank-badge ${rankBadgeClass(student.rank)}`}>{student.rank}</span></td>
                      <td>{student.roll}</td><td>{student.name}</td>
                      {tableSubjects.map((subject) => {
                        const totals = getStudentSubjectRawTotals(student, subject);
                        const percentage = getStudentSubjectPercentage(student, subject);
                        const display = totals ? totals.obtained.toFixed(1) : "-";
                        return <td key={`${student.roll}-${subject}`} className={scoreClass(percentage)}>{display}</td>;
                      })}
                      <td className={scoreClass(student.api)}>{student.api.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sd-table-footer">
              <span>Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length} students</span>
              <div className="sd-pagination">
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><FiChevronLeft /> Previous</button>
                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FiChevronRight /></button>
              </div>
            </div>

            {quickReport}
          </section>
        )}

        {activeTab === "subjects" && (
          <section className="sd-panel">
            <h2>Subject-wise Analysis</h2>
            <div className="sd-subject-list">
              {subjectCards.map((subject) => (
                <article className="sd-subject-card" key={subject.key}>
                  <div className="sd-subject-head"><h3>{subject.label}</h3><span className="sd-pass-pill">{subject.passPercentage.toFixed(1)}% Pass</span></div>
                  <div className="sd-subject-stats">
                    <div><label>Average</label><strong className={scoreClass(subject.average)}>{subject.average.toFixed(1)}</strong></div>
                    <div><label>Highest</label><strong className="score-green">{subject.highest.toFixed(1)}</strong></div>
                    <div><label>Lowest</label><strong className="score-red">{subject.lowest.toFixed(1)}</strong></div>
                    <div><label>Failed</label><strong className="score-red">{subject.failed} {subject.failed === 1 ? "student" : "students"}</strong></div>
                    <div><label>Pass %</label><div className="sd-progress"><span style={{ width: `${subject.passPercentage}%` }} /></div></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "rankings" && (
          <section className="sd-panel">
            <div className="sd-panel-head">
              <h2>Merit List - Top 10 Students</h2>
              <div className="sd-icon-buttons"><button type="button" onClick={handleDownloadMeritPdf}><FiDownload /> PDF</button><button type="button" onClick={handleDownloadMeritExcel}><FiFileText /> Excel</button></div>
            </div>
            <div className="sd-ranking-list">
              {topTen.map((student) => (
                <article key={student.roll} className={`sd-ranking-row ${student.rank <= 3 ? "top" : ""}`}>
                  <div className="sd-ranking-left">
                    <span className={`sd-medal ${rankBadgeClass(student.rank)}`}>{student.rank <= 3 ? <FiAward /> : null}</span>
                    <div className="sd-ranking-name"><span className={`sd-rank-label ${rankBadgeClass(student.rank)}`}>Rank {student.rank}</span><h3>{student.name}</h3><p>{student.roll}</p></div>
                  </div>
                  <div className="sd-ranking-right"><strong>{student.api.toFixed(2)}</strong><span>API Score</span></div>
                </article>
              ))}
            </div>
            <div className="sd-podium-grid">
              {topTen.slice(0, 3).map((student) => (
                <article key={student.roll} className={`sd-podium-card podium-${student.rank}`}>
                  <span className="sd-medal"><FiAward /></span>
                  <span className={`sd-rank-label ${rankBadgeClass(student.rank)}`}>Rank {student.rank}</span>
                  <h3>{student.name}</h3><p>{student.roll}</p><strong>{student.api.toFixed(2)}</strong><span>API Score</span>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeTab === "weak" && (
          <section className="sd-panel">
            <div className="sd-weak-summary-grid">
              <article className="sd-weak-summary critical"><span className="circle"><FiAlertTriangle /></span><div><h4>Critical (API &lt; 50)</h4><strong>{weakSegments.critical.length}</strong></div></article>
              <article className="sd-weak-summary multiple"><span className="circle"><FiInfo /></span><div><h4>Multiple Failures</h4><strong>{weakSegments.multiple.length}</strong></div></article>
              <article className="sd-weak-summary borderline"><span className="circle"><FiTrendingDown /></span><div><h4>Borderline (50-60)</h4><strong>{weakSegments.borderline.length}</strong></div></article>
            </div>
            <section className="sd-weak-block">
              <h3 className="score-red"><FiAlertTriangle /> Critical Students (API &lt; 50 or 3+ failed subjects)</h3>
              {weakSegments.critical.length === 0 ? <p>No critical students identified for the selected year.</p> : null}
              {weakSegments.critical.map((student) => (
                <article key={student.roll} className="sd-weak-item critical"><h4>{student.name} ({student.roll})</h4><p>API: <strong>{student.api.toFixed(1)}</strong> | Rank: {student.rank}</p><div className="sd-chip-wrap">{student.failedSubjects.map((sub) => <span key={sub} className="sd-chip critical">Failed: {sub}</span>)}</div></article>
              ))}
            </section>
            <section className="sd-weak-block">
              <h3 className="score-orange"><FiInfo /> Students with Multiple Failures (2+ subjects)</h3>
              {weakSegments.multiple.length === 0 ? <p>No students currently have multiple failures for the selected year.</p> : null}
              {weakSegments.multiple.map((student) => (
                <article key={student.roll} className="sd-weak-item multiple"><h4>{student.name} ({student.roll})</h4><p>API: <strong>{student.api.toFixed(1)}</strong> | Rank: {student.rank}</p><div className="sd-chip-wrap">{student.failedSubjects.map((sub) => <span key={sub} className="sd-chip multiple">{sub}</span>)}</div></article>
              ))}
            </section>
            <section className="sd-weak-block">
              <h3 className="score-yellow"><FiTrendingDown /> Borderline Students (API 50-60)</h3>
              <div className="sd-borderline-grid">
                {weakSegments.borderline.length === 0 ? <p>No borderline students identified for the selected year.</p> : null}
                {weakSegments.borderline.map((student) => (
                  <article key={student.roll} className="sd-borderline-card"><div><h4>{student.name}</h4><p>{student.roll}</p></div><div className="align-right"><strong>{student.api.toFixed(1)}</strong><p>Rank {student.rank}</p></div></article>
                ))}
              </div>
            </section>
            <section className="sd-recommendations">
              <h3>Recommendations for Remedial Action:</h3>
              <ul><li>Schedule one-on-one counseling sessions with critical students</li><li>Organize remedial classes for weak subjects</li><li>Implement peer tutoring programs</li><li>Provide additional study materials and resources</li><li>Monitor progress weekly through regular assessments</li></ul>
            </section>
            {quickReport}
          </section>
        )}

        {activeTab === "analytics" && (
          <section className="sd-panel">
            <section className="sd-chart-card">
              <h3>Subject-wise Average Performance</h3>
              <ResponsiveContainer width="100%" height={460}><BarChart data={analytics.barData}><CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#417fe0" radius={[12, 12, 0, 0]} /></BarChart></ResponsiveContainer>
            </section>
            <div className="sd-chart-grid">
              <section className="sd-chart-card">
                <h3>Grade Distribution</h3>
                <ResponsiveContainer width="100%" height={420}><PieChart><Pie data={analytics.pieData} dataKey="value" nameKey="name" outerRadius={140} label>{analytics.pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
              </section>
              <section className="sd-chart-card">
                <h3>NORMALIZED Score Distribution</h3>
                <ResponsiveContainer width="100%" height={420}><LineChart data={analytics.lineData}><CartesianGrid strokeDasharray="4 4" stroke="#d1d5db" /><XAxis dataKey="range" /><YAxis /><Tooltip /><Line type="monotone" dataKey="students" stroke="#7f5ce4" strokeWidth={4} dot={{ r: 8, fill: "#ffffff", strokeWidth: 4 }} /></LineChart></ResponsiveContainer>
              </section>
            </div>
          </section>
        )}

        {activeTab === "queries" && (
          <section className="sd-panel">
            <div className="sd-query-summary-grid">
              <article className="sd-query-summary-card"><span className="sd-stat-icon icon-blue"><FiFileText /></span><div><h4>Total Queries</h4><strong className="score-blue">{queryStats.total}</strong></div></article>
              <article className="sd-query-summary-card"><span className="sd-stat-icon icon-orange"><FiInfo /></span><div><h4>Pending</h4><strong className="score-orange">{queryStats.pending}</strong></div></article>
              <article className="sd-query-summary-card"><span className="sd-stat-icon icon-green"><FiCheckCircle /></span><div><h4>Answered</h4><strong className="score-green">{queryStats.answered}</strong></div></article>
            </div>
            <section className="sd-query-panel">
              <div className="sd-panel-head">
                <h2>Student Queries</h2>
                <div className="sd-query-filters">
                  <button type="button" className={queryFilter === "all" ? "active" : ""} onClick={() => setQueryFilter("all")}>All</button>
                  <button type="button" className={queryFilter === "pending" ? "active" : ""} onClick={() => setQueryFilter("pending")}>Pending ({queryStats.pending})</button>
                  <button type="button" className={queryFilter === "answered" ? "active" : ""} onClick={() => setQueryFilter("answered")}>Answered ({queryStats.answered})</button>
                </div>
              </div>
              <div className="sd-query-list">
                {visibleQueries.map((query) => (
                  <article key={query.id} className="sd-query-card">
                    <div className="sd-query-userline"><h3><FiUser /> {query.studentName} <span>({query.roll})</span></h3><span className={`sd-status ${query.status}`}>{query.status === "answered" ? "Answered" : "Pending"}</span></div>
                    <div className="sd-query-meta"><span className="subject-chip">{query.subject}</span><span>{query.date}</span></div>
                    <div className="sd-query-question"><h4>Student's Question:</h4><p>{query.question}</p></div>
                    {query.status === "answered" ? (
                      <div className="sd-query-response-view"><h4>Your Response:</h4><p>{query.response}</p></div>
                    ) : (
                      <div className="sd-query-reply"><label htmlFor={`reply-${query.id}`}>Your Response:</label><textarea id={`reply-${query.id}`} placeholder="Type your response here..." value={queryReplies[query.id] ?? ""} onChange={(event) => setQueryReplies((prev) => ({ ...prev, [query.id]: event.target.value }))} /><button type="button" onClick={() => handleReplySubmit(query.id)}><FiSend /> Send Response</button></div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeTab === "marks" && (
          <section className="sd-panel">
            <h2>Marks Entry &amp; Management</h2>
            <p className="sd-subtitle">Enter marks manually or upload an Excel sheet for bulk entry</p>
            <div className="sd-mode-toggle"><button type="button" className={marksMode === "manual" ? "active" : ""} onClick={() => setMarksMode("manual")}>Manual Entry</button><button type="button" className={marksMode === "upload" ? "active" : ""} onClick={() => setMarksMode("upload")}>Upload Excel</button></div>
            {marksMode === "manual" ? (
              <div className="sd-manual-form">
                <div><label>Subject</label><div className="sd-select-wrap"><select value={markForm.subject} onChange={(event) => setMarkForm((prev) => ({ ...prev, subject: event.target.value }))}><option value="">Select subject</option>{tableSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select><FiChevronDown /></div></div>
                <div><label>Roll Number</label><input type="text" placeholder="e.g., 2023MBBS001" value={markForm.roll} onChange={(event) => setMarkForm((prev) => ({ ...prev, roll: event.target.value }))} /></div>
                <div><label>Marks</label><input type="number" placeholder="Enter marks" value={markForm.marks} onChange={(event) => setMarkForm((prev) => ({ ...prev, marks: event.target.value }))} /></div>
                <button type="button" className="sd-primary-btn full" onClick={handleSaveMark}><FiFileText /> {editingEntryId ? "Update Marks" : "Save Marks"}</button>
              </div>
            ) : (
              <div className="sd-upload-block"><FiFileText className="upload-placeholder" /><p>Upload an Excel file with student marks</p><label className="sd-primary-btn" htmlFor="excelFile"><FiUpload /> Choose Excel File</label><input id="excelFile" type="file" accept=".xls,.xlsx" onChange={handleChooseUpload} hidden />{uploadFileName ? <span className="sd-file-name"><FiPaperclip /> {uploadFileName}</span> : null}</div>
            )}
            <hr className="sd-divider" />
            <section>
              <h3>Recent Entries</h3>
              <div className="sd-entry-list">{recentEntries.map((entry) => (<article key={entry.id} className="sd-entry-card"><div><h4>{entry.roll}</h4><p>{entry.subject} | {entry.marks}</p></div><div className="sd-entry-actions"><button type="button" onClick={() => handleEditEntry(entry)}><FiFileText /> Edit</button><button type="button" onClick={() => handleDeleteEntry(entry.id)}><FiX /> Delete</button></div></article>))}</div>
            </section>
            <section className="sd-format-card"><h3>Excel Format Requirements:</h3><ul><li>Column A: Roll Number</li><li>Column B: Student Name</li><li>Columns C onwards: Subject marks</li><li>First row should contain headers</li><li>Save file as .xlsx or .xls format</li></ul></section>
            <button type="button" className="sd-template-btn" onClick={handleDownloadTemplate}><FiFileText /> Download Template</button>
          </section>
        )}
      </main>

      {toast ? <div className="sd-toast">{toast}</div> : null}
    </div>
  );
}

export default StaffDashboard;

