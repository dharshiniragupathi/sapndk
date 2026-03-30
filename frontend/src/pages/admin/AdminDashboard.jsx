
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  FiAward,
  FiBarChart2,
  FiBook,
  FiCheckCircle,
  FiChevronDown,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiPlus,
  FiSave,
  FiSearch,
  FiSettings,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { clearAuthSession, getAuthToken } from "../../utils/authStorage";
import {
  MBBS_EXAM_STRUCTURE as MBBS_DEMO_EXAM_STRUCTURE,
  MBBS_SUBJECT_TOTALS,
  buildMbbsDemoExamRows,
} from "../../data/mbbsDemoMarksSeed";
import "./AdminDashboard.css";

const TABS = ["overview", "students", "staff", "subjects", "marks", "settings", "reports"];
const MARKS_TABS = ["add", "view", "upload"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const mbbsSubjects = [
  { code: "MBBS101", name: "Anatomy", department: "MBBS", year: "1st", maxMarks: MBBS_SUBJECT_TOTALS.MBBS101.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS101.passMarks, credits: 4 },
  { code: "MBBS102", name: "Physiology", department: "MBBS", year: "1st", maxMarks: MBBS_SUBJECT_TOTALS.MBBS102.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS102.passMarks, credits: 4 },
  { code: "MBBS103", name: "Biochemistry", department: "MBBS", year: "1st", maxMarks: MBBS_SUBJECT_TOTALS.MBBS103.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS103.passMarks, credits: 3 },
  { code: "MBBS201", name: "Pathology", department: "MBBS", year: "2nd", maxMarks: MBBS_SUBJECT_TOTALS.MBBS201.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS201.passMarks, credits: 5 },
  { code: "MBBS202", name: "Microbiology", department: "MBBS", year: "2nd", maxMarks: MBBS_SUBJECT_TOTALS.MBBS202.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS202.passMarks, credits: 4 },
  { code: "MBBS203", name: "Forensic Medicine", department: "MBBS", year: "2nd", maxMarks: MBBS_SUBJECT_TOTALS.MBBS203.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS203.passMarks, credits: 4 },
  { code: "MBBS301", name: "Community Medicine", department: "MBBS", year: "3rd", maxMarks: MBBS_SUBJECT_TOTALS.MBBS301.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS301.passMarks, credits: 5 },
  { code: "MBBS302", name: "Ophthalmology", department: "MBBS", year: "3rd", maxMarks: MBBS_SUBJECT_TOTALS.MBBS302.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS302.passMarks, credits: 4 },
  { code: "MBBS303", name: "ENT", department: "MBBS", year: "3rd", maxMarks: MBBS_SUBJECT_TOTALS.MBBS303.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS303.passMarks, credits: 4 },
  { code: "MBBS401", name: "General Medicine", department: "MBBS", year: "Final", maxMarks: MBBS_SUBJECT_TOTALS.MBBS401.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS401.passMarks, credits: 5 },
  { code: "MBBS402", name: "General Surgery", department: "MBBS", year: "Final", maxMarks: MBBS_SUBJECT_TOTALS.MBBS402.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS402.passMarks, credits: 5 },
  { code: "MBBS403", name: "OBG", department: "MBBS", year: "Final", maxMarks: MBBS_SUBJECT_TOTALS.MBBS403.maxMarks, passMarks: MBBS_SUBJECT_TOTALS.MBBS403.passMarks, credits: 4 },
];

const MD_SPECIALIZATIONS = [
  "General Medicine",
  "Pediatrics",
  "Dermatology",
  "Psychiatry",
  "Radiology",
  "Anesthesiology",
];

const MD_SPECIALIZATION_CODES = {
  "General Medicine": "GM",
  Pediatrics: "PD",
  Dermatology: "DM",
  Psychiatry: "PS",
  Radiology: "RD",
  Anesthesiology: "AN",
};

const createMdSpecializationCatalog = () => {
  const bySpecialization = {
    "General Medicine": [
      { suffix: "101", name: "Advanced Internal Medicine", year: "Year 1", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "102", name: "Cardio Respiratory Medicine", year: "Year 1", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "201", name: "Critical Care Medicine", year: "Year 2", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "202", name: "Hospital Management", year: "Year 2", maxMarks: 100, passMarks: 50, credits: 4 },
      { suffix: "301", name: "Thesis Evaluation", year: "Year 3", maxMarks: 200, passMarks: 100, credits: 6 },
    ],
    Pediatrics: [
      { suffix: "101", name: "Advanced Pediatrics", year: "Year 1", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "102", name: "Neonatal Medicine", year: "Year 1", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "201", name: "Pediatric Critical Care", year: "Year 2", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "202", name: "Medical Ethics", year: "Year 2", maxMarks: 100, passMarks: 50, credits: 3 },
      { suffix: "301", name: "Thesis Evaluation", year: "Year 3", maxMarks: 200, passMarks: 100, credits: 6 },
    ],
    Dermatology: [
      { suffix: "101", name: "Clinical Dermatology", year: "Year 1", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "102", name: "Dermatopathology", year: "Year 1", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "201", name: "Research Methodology", year: "Year 2", maxMarks: 100, passMarks: 50, credits: 4 },
      { suffix: "202", name: "Dermatosurgery", year: "Year 2", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "301", name: "Thesis Evaluation", year: "Year 3", maxMarks: 200, passMarks: 100, credits: 6 },
    ],
    Psychiatry: [
      { suffix: "101", name: "Clinical Psychiatry", year: "Year 1", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "102", name: "Psychopharmacology", year: "Year 1", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "201", name: "Behavioral Sciences", year: "Year 2", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "202", name: "Medical Ethics", year: "Year 2", maxMarks: 100, passMarks: 50, credits: 3 },
      { suffix: "301", name: "Thesis Evaluation", year: "Year 3", maxMarks: 200, passMarks: 100, credits: 6 },
    ],
    Radiology: [
      { suffix: "101", name: "Advanced Radiology", year: "Year 1", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "102", name: "Diagnostic Procedures", year: "Year 1", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "201", name: "Interventional Radiology", year: "Year 2", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "202", name: "Research Methodology", year: "Year 2", maxMarks: 100, passMarks: 50, credits: 4 },
      { suffix: "301", name: "Thesis Evaluation", year: "Year 3", maxMarks: 200, passMarks: 100, credits: 6 },
    ],
    Anesthesiology: [
      { suffix: "101", name: "Clinical Anesthesiology", year: "Year 1", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "102", name: "Applied Pharmacology", year: "Year 1", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "201", name: "Critical Care", year: "Year 2", maxMarks: 200, passMarks: 100, credits: 6 },
      { suffix: "202", name: "Pain Medicine", year: "Year 2", maxMarks: 150, passMarks: 75, credits: 5 },
      { suffix: "301", name: "Hospital Management", year: "Year 3", maxMarks: 100, passMarks: 50, credits: 4 },
    ],
  };

  return MD_SPECIALIZATIONS.flatMap((specialization) =>
    (bySpecialization[specialization] || []).map((subject) => ({
      code: `MD${MD_SPECIALIZATION_CODES[specialization]}${subject.suffix}`,
      name: subject.name,
      department: "MD",
      year: subject.year,
      specialization,
      maxMarks: subject.maxMarks,
      passMarks: subject.passMarks,
      credits: subject.credits,
    }))
  );
};

const mdSpecializedCatalog = createMdSpecializationCatalog();

const mdSubjects = [
  { code: "MD101", name: "Advanced Pathology", department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry", maxMarks: 200, passMarks: 100, credits: 6 },
  { code: "MD102", name: "Clinical Medicine", department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Psychiatry", maxMarks: 200, passMarks: 100, credits: 6 },
  { code: "MD103", name: "Advanced Pharmacology", department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", maxMarks: 150, passMarks: 75, credits: 5 },
  { code: "MD104", name: "Research Methodology", department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", maxMarks: 100, passMarks: 50, credits: 4 },
  { code: "MD105", name: "Diagnostic Procedures", department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Radiology, Anesthesiology", maxMarks: 150, passMarks: 75, credits: 5 },
  { code: "MD106", name: "Medical Ethics", department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", maxMarks: 100, passMarks: 50, credits: 3 },
  { code: "MD107", name: "Critical Care", department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Anesthesiology", maxMarks: 200, passMarks: 100, credits: 6 },
  { code: "MD108", name: "Advanced Radiology", department: "MD", year: "Year 2", specialization: "Radiology, General Medicine, Pediatrics", maxMarks: 150, passMarks: 75, credits: 5 },
  { code: "MD109", name: "Hospital Management", department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", maxMarks: 100, passMarks: 50, credits: 4 },
  { code: "MD110", name: "Thesis Evaluation", department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", maxMarks: 200, passMarks: 100, credits: 6 },
];

const SUBJECT_YEAR_ORDER = {
  "1st": 1,
  "2nd": 2,
  "3rd": 3,
  Final: 4,
  "Year 1": 1,
  "Year 2": 2,
};

const mbbsStudents = [
  "Rohan Kapoor", "Meera Iyer", "Aditya Kumar", "Akash Sinha", "Kavya Pillai", "Vikram Singh", "Arjun Patel", "Priya Sharma", "Sneha Gupta", "Divya Nair",
  "Ritu Sharma", "Aman Khanna", "Ishita Joshi", "Rahul Verma", "Tanvi Malhotra", "Nikhil Bhat", "Ananya Reddy", "Aman Kumar", "Pooja Desai", "Riya Chatterjee",
  "Kunal Arora", "Sanjana Rao", "Harsha V", "Mithun Das", "Vivek Menon", "Lakshmi Pillai", "Ritesh Paul", "Neha Kulkarni", "Apoorva Shetty", "Yuvraj Sen",
];

const finalYearMbbsStudents = [
  { roll: "2022MBBS028", name: "Harish Rao" },
  { roll: "2022MBBS029", name: "Nivedita Sen" },
  { roll: "2022MBBS030", name: "Karan Malhotra" },
  { roll: "2022MBBS031", name: "Isha Menon" },
  { roll: "2022MBBS032", name: "Siddharth Jain" },
  { roll: "2022MBBS033", name: "Lavanya Reddy" },
  { roll: "2022MBBS034", name: "Arnav Kapoor" },
  { roll: "2022MBBS035", name: "Megha Nair" },
  { roll: "2022MBBS036", name: "Ritwik Das" },
  { roll: "2022MBBS037", name: "Shruti Kulkarni" },
  { roll: "2022MBBS038", name: "Devansh Mehta" },
  { roll: "2022MBBS039", name: "Anika Bose" },
  { roll: "2022MBBS040", name: "Pranav Iyer" },
  { roll: "2022MBBS041", name: "Sania Thomas" },
  { roll: "2022MBBS042", name: "Yash Patel" },
  { roll: "2022MBBS043", name: "Mitali Ghosh" },
  { roll: "2022MBBS044", name: "Rohit Bansal" },
  { roll: "2022MBBS045", name: "Tanya Pillai" },
  { roll: "2022MBBS046", name: "Aarav Chopra" },
  { roll: "2022MBBS047", name: "Neha Venkatesh" },
];

const mdStudents = [
  "Dr. Meena Chatterjee", "Dr. Tanuja Mehta", "Dr. Priya Iyer", "Dr. Rohit Nair", "Dr. Anjali Mehta", "Dr. Kavita Nair", "Dr. Deepika Singh", "Dr. Ritu Malhotra", "Dr. Madhuri Pillai", "Dr. Arjun Rao",
  "Dr. Karthik Menon", "Dr. Neha Varma", "Dr. Sanjay Nair", "Dr. Aman Reddy", "Dr. Bhavna Iyer", "Dr. Surya Patel", "Dr. Geeta Sharma", "Dr. Nisha Reddy", "Dr. Tarun Joshi", "Dr. Kiran Rao",
  "Dr. Manish Gupta", "Dr. Pooja Menon", "Dr. Tejas Patel", "Dr. Niharika Iyer", "Dr. Vishal Nair", "Dr. Sarika Menon", "Dr. Pradeep Rao", "Dr. Vani Sharma", "Dr. Ritika Gupta", "Dr. Saurabh Iyer",
];

const methods = [
  { id: "zscore", name: "Z Score Method", desc: "Standard Z-Score normalization with mean 0 and standard deviation 1" },
  { id: "minmax", name: "Min Max Method", desc: "Min-Max normalization scaling scores between 0-100" },
  { id: "percentile", name: "Percentile Method", desc: "Percentile-based normalization ranking students" },
];

const SUBJECT_META_BY_CODE = {
  MBBS101: { department: "MBBS", year: "1st", passMarks: MBBS_SUBJECT_TOTALS.MBBS101.passMarks, credits: 4 },
  MBBS102: { department: "MBBS", year: "1st", passMarks: MBBS_SUBJECT_TOTALS.MBBS102.passMarks, credits: 4 },
  MBBS103: { department: "MBBS", year: "1st", passMarks: MBBS_SUBJECT_TOTALS.MBBS103.passMarks, credits: 3 },
  MBBS201: { department: "MBBS", year: "2nd", passMarks: MBBS_SUBJECT_TOTALS.MBBS201.passMarks, credits: 5 },
  MBBS202: { department: "MBBS", year: "2nd", passMarks: MBBS_SUBJECT_TOTALS.MBBS202.passMarks, credits: 4 },
  MBBS203: { department: "MBBS", year: "2nd", passMarks: MBBS_SUBJECT_TOTALS.MBBS203.passMarks, credits: 4 },
  MBBS301: { department: "MBBS", year: "3rd", passMarks: MBBS_SUBJECT_TOTALS.MBBS301.passMarks, credits: 5 },
  MBBS302: { department: "MBBS", year: "3rd", passMarks: MBBS_SUBJECT_TOTALS.MBBS302.passMarks, credits: 4 },
  MBBS303: { department: "MBBS", year: "3rd", passMarks: MBBS_SUBJECT_TOTALS.MBBS303.passMarks, credits: 4 },
  MBBS401: { department: "MBBS", year: "Final", passMarks: MBBS_SUBJECT_TOTALS.MBBS401.passMarks, credits: 5 },
  MBBS402: { department: "MBBS", year: "Final", passMarks: MBBS_SUBJECT_TOTALS.MBBS402.passMarks, credits: 5 },
  MBBS403: { department: "MBBS", year: "Final", passMarks: MBBS_SUBJECT_TOTALS.MBBS403.passMarks, credits: 4 },
  MD101: { department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry", passMarks: 100, credits: 6 },
  MD102: { department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Psychiatry", passMarks: 100, credits: 6 },
  MD103: { department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", passMarks: 75, credits: 5 },
  MD104: { department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", passMarks: 50, credits: 4 },
  MD105: { department: "MD", year: "Year 1", specialization: "General Medicine, Pediatrics, Radiology, Anesthesiology", passMarks: 75, credits: 5 },
  MD106: { department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", passMarks: 50, credits: 3 },
  MD107: { department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Anesthesiology", passMarks: 100, credits: 6 },
  MD108: { department: "MD", year: "Year 2", specialization: "Radiology, General Medicine, Pediatrics", passMarks: 75, credits: 5 },
  MD109: { department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", passMarks: 50, credits: 4 },
  MD110: { department: "MD", year: "Year 2", specialization: "General Medicine, Pediatrics, Dermatology, Psychiatry, Radiology, Anesthesiology", passMarks: 100, credits: 6 },
};

mdSpecializedCatalog.forEach((subject) => {
  SUBJECT_META_BY_CODE[subject.code] = {
    department: subject.department,
    year: subject.year,
    specialization: subject.specialization,
    passMarks: subject.passMarks,
    credits: subject.credits,
  };
});

const SUBJECT_META_BY_NAME = [...mbbsSubjects, ...mdSubjects, ...mdSpecializedCatalog].reduce((acc, subject) => {
  acc[subject.name.toLowerCase()] = {
    code: subject.code,
    department: subject.department,
    year: subject.year,
    specialization: subject.specialization,
    maxMarks: subject.maxMarks,
    passMarks: subject.passMarks,
    credits: subject.credits,
  };
  return acc;
}, {});

const normalizeDepartment = (value) => {
  const dept = String(value || "").trim().toUpperCase();
  if (dept === "MBBS" || dept === "MD") return dept;
  return "";
};

const buildStudentEmailFromName = (name) => {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "");
  return `${base || "student"}@avp.ac.in`;
};

const normalizeDepartmentFromStaffRow = (row) => {
  const direct = normalizeDepartment(row.department);
  if (direct) return direct;
  const byId = Number(row.department_id ?? row.departmentId);
  if (byId === 1) return "MBBS";
  if (byId === 2) return "MD";
  return "MBBS";
};

const buildUniqueSubjectsByStaffId = (rows) =>
  (Array.isArray(rows) ? rows : []).reduce((acc, row) => {
    const key = String(row.staff_id ?? "");
    const subjectName = String(row.subject_name || "").trim();
    if (!key || !subjectName) return acc;
    if (!acc[key]) acc[key] = new Set();
    acc[key].add(subjectName);
    return acc;
  }, {});

const getYearLevel = (row) => {
  const yearText = String(row.year || "").toLowerCase();
  if (yearText.includes("year 1") || yearText === "1") return 1;
  if (yearText.includes("year 2") || yearText === "2") return 2;
  if (yearText.includes("year 3") || yearText === "3") return 3;
  if (yearText.includes("year 4") || yearText.includes("final") || yearText === "4") return 4;

  const semester = Number(row.semester);
  if (Number.isFinite(semester) && semester > 0) {
    return Math.min(4, Math.max(1, Math.ceil(semester / 2)));
  }
  return null;
};

const getSemesterFromYearLabel = (year) => {
  const level = getYearLevel({ year });
  return Number.isFinite(level) ? level * 2 : null;
};

const getYearLabelFromSemester = (semesterValue) => {
  const semester = Number(semesterValue);
  if (!Number.isFinite(semester) || semester <= 0) return "";
  return `Year ${Math.ceil(semester / 2)}`;
};

const getStudentYearLabel = (row) => {
  const direct = String(row?.year || "").trim();
  if (direct) return direct;
  return getYearLabelFromSemester(row?.semester);
};

const getAssignedYearLabels = (rows) => {
  const yearMap = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const label = getStudentYearLabel(row);
    if (!label) return;
    const order = getYearLevel(row) ?? Number.MAX_SAFE_INTEGER;
    yearMap.set(label, order);
  });

  return Array.from(yearMap.entries())
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([label]) => label);
};

const buildAssignedStudentDetails = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((student) => ({
      id: Number(student.id),
      name: String(student.name || student.student_name || `Student ${student.id || ""}`).trim(),
      roll: String(student.usn || student.roll || "").trim().toUpperCase(),
      year: getStudentYearLabel(student) || "N/A",
      yearLevel: getYearLevel(student) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.yearLevel - b.yearLevel || a.name.localeCompare(b.name));

const toSubjectOption = (subject) => ({
  id: Number(subject.dbId ?? subject.id),
  code: String(subject.code ?? subject.subject_code ?? "").trim().toUpperCase(),
  name: String(subject.name ?? subject.subject_name ?? "").trim(),
  department: String(subject.department ?? subject.course ?? "").trim().toUpperCase(),
  year: String(subject.year ?? "").trim(),
});

const normalizeSubjectSearchValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getSubjectAcronym = (value) =>
  normalizeSubjectSearchValue(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("");

const matchesSubjectSearch = (subject, query) => {
  const normalizedQuery = normalizeSubjectSearchValue(query);
  if (!normalizedQuery) return false;

  const normalizedCode = normalizeSubjectSearchValue(subject?.code);
  const normalizedName = normalizeSubjectSearchValue(subject?.name);
  const acronym = getSubjectAcronym(subject?.name);

  return (
    normalizedCode === normalizedQuery ||
    normalizedName === normalizedQuery ||
    acronym === normalizedQuery ||
    normalizedCode.includes(normalizedQuery) ||
    normalizedName.includes(normalizedQuery)
  );
};

const buildSubjectPayload = (subject) => ({
  subject_code: String(subject?.code || "").trim().toUpperCase(),
  subject_name: String(subject?.name || "").trim(),
  max_marks: Number(subject?.maxMarks ?? 0),
  pass_marks: Number(subject?.passMarks ?? 0),
  credits: Number(subject?.credits ?? 0),
  course: String(subject?.department || "").trim().toUpperCase() || null,
  year: String(subject?.year || "").trim() || null,
  specialization: String(subject?.specialization || "").trim() || null,
});

const normalizeSubjectApiRow = (row) => {
  const name = String(row?.subject_name || row?.name || "").trim();
  const nameMeta = SUBJECT_META_BY_NAME[name.toLowerCase()] || {};
  const code = String(row?.subject_code || row?.code || nameMeta.code || "").trim().toUpperCase();
  const meta = SUBJECT_META_BY_CODE[code] || nameMeta;
  const derivedDepartment = code.startsWith("MD") ? "MD" : code.startsWith("MBBS") ? "MBBS" : "";

  return {
    dbId: row?.id,
    code,
    name,
    department: meta.department || row?.course || row?.department || derivedDepartment || "MBBS",
    year: String(row?.year || meta.year || "").trim(),
    specialization: String(row?.specialization || meta.specialization || "").trim(),
    maxMarks: Number(row?.max_marks ?? row?.maxMarks ?? meta.maxMarks ?? 0),
    passMarks: Number(row?.pass_marks ?? row?.passMarks ?? meta.passMarks ?? 50),
    credits: Number(row?.credits ?? meta.credits ?? 4),
  };
};

const getRollStartYear = (row) => {
  if (getYearLevel(row) === 4) return "2022";
  const yearLevel = getYearLevel(row);
  if (yearLevel === 3) return "2023";
  if (yearLevel === 2) return "2024";
  if (yearLevel === 1) return "2025";
  return "2023";
};

const buildStudentRollNo = (row, department, departmentCounters, fallback = "") => {
  if (department !== "MBBS" && department !== "MD") return String(fallback || "");
  const existing = String(fallback || row?.usn || row?.roll || "").trim().toUpperCase();
  if (existing) {
    const pattern = department === "MBBS" ? /^\d{4}MBBS\d+$/ : /^\d{4}MD\d+$/;
    if (pattern.test(existing)) return existing;
  }
  const rollStartYear = getRollStartYear(row);
  const counterKey = `${rollStartYear}_${department}`;
  departmentCounters[counterKey] = (departmentCounters[counterKey] || 0) + 1;
  return `${rollStartYear}${department}${String(departmentCounters[counterKey]).padStart(3, "0")}`;
};

const batchFromRoll = (roll) => {
  const match = String(roll || "").match(/^(\d{4})/);
  return match ? match[1] : "";
};

const deriveBatch = (row, roll) => {
  const direct = row.batch ?? row.academic_year;
  if (direct !== undefined && direct !== null && String(direct).trim() !== "") return String(direct);
  const source = String(row.usn || roll || "");
  const match = source.match(/^(\d{4})/);
  return match ? match[1] : "";
};

const escapePdfText = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const createSimplePdfBlob = (lines) => {
  const safeLines = (Array.isArray(lines) ? lines : [String(lines || "")]).map(escapePdfText);
  const content = ["BT", "/F1 12 Tf", "50 790 Td", "14 TL", ...safeLines.map((line) => `(${line}) Tj T*`), "ET"].join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

const createStudents = () => {
  const list = [];
  let api = 99.98;
  const deptCounters = {};

  for (let i = 0; i < mdStudents.length; i += 1) {
    const yearLabel = `Year ${(i % 2) + 1}`;
    list.push({
      roll: buildStudentRollNo({ year: yearLabel }, "MD", deptCounters),
      name: mdStudents[i],
      department: "MD",
      year: yearLabel,
      batch: getRollStartYear({ year: yearLabel }),
      api: Number(api.toFixed(2)),
      status: "active",
    });
    api -= 1.15;
  }

  api = 98.96;
  for (let i = 0; i < mbbsStudents.length; i += 1) {
    const yearLabel = `Year ${(i % 3) + 1}`;
    list.push({
      roll: buildStudentRollNo({ year: yearLabel }, "MBBS", deptCounters),
      name: mbbsStudents[i],
      department: "MBBS",
      year: yearLabel,
      batch: getRollStartYear({ year: yearLabel }),
      api: Number(api.toFixed(2)),
      status: "active",
    });
    api -= 2.35;
  }

  api = 92.4;
  for (let i = 0; i < finalYearMbbsStudents.length; i += 1) {
    list.push({
      roll: finalYearMbbsStudents[i].roll,
      name: finalYearMbbsStudents[i].name,
      department: "MBBS",
      year: "Year 4",
      batch: "2022",
      api: Number(api.toFixed(2)),
      status: "active",
    });
    api -= 1.1;
  }

  return list.sort((a, b) => b.api - a.api).map((s, idx) => ({ ...s, rank: idx + 1 }));
};

const MBBS_YEAR_LABEL_MAP = {
  "Year 1": "1st",
  "Year 2": "2nd",
  "Year 3": "3rd",
  "Year 4": "Final",
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "Final",
};

const MBBS_EXAM_STRUCTURE = MBBS_DEMO_EXAM_STRUCTURE;
const DEFAULT_MBBS_EXAM_NAME = MBBS_EXAM_STRUCTURE[0]?.name || "Internal 1";
const MBBS_MARKS_SEED_VERSION = "mbbs-marks-v2-2026-03-14";

const buildFallbackMbbsExamRows = ({ student, studentIndex, subject, subjectIndex, startId = 1 }) => {
  const markSpread = Math.max(10, subject.maxMarks - subject.passMarks - 5);
  const baseMarks = subject.passMarks + 5 + ((studentIndex * 11 + subjectIndex * 7) % markSpread);

  return MBBS_EXAM_STRUCTURE.map((examTemplate, examIndex) => {
    const normalizedBase = Math.max(
      35,
      Math.min(92, ((baseMarks + examIndex * 4) / Math.max(subject.maxMarks, 1)) * 100)
    );
    const rawMarks = Number(((normalizedBase / 100) * examTemplate.maxMarks).toFixed(2));

    return {
      id: startId + examIndex,
      studentRoll: student.roll,
      subjectCode: subject.code,
      examName: examTemplate.name,
      rawMarks,
      normalized: Number(((rawMarks / examTemplate.maxMarks) * 100).toFixed(2)),
    };
  });
};

const createInitialMarks = () => {
  const students = createStudents();
  let markId = 1;

  return students
    .filter((student) => student.department === "MBBS")
    .flatMap((student, studentIndex) => {
      const yearLabel = MBBS_YEAR_LABEL_MAP[String(student.year || "").trim()] || "";
      return mbbsSubjects
        .filter((subject) => subject.year === yearLabel)
        .flatMap((subject, subjectIndex) => {
          const demoRows = buildMbbsDemoExamRows({
            studentRoll: student.roll,
            subjectCode: subject.code,
            startId: markId,
          });
          if (demoRows.length > 0) {
            markId += demoRows.length;
            return demoRows;
          }

          const fallbackRows = buildFallbackMbbsExamRows({ student, studentIndex, subject, subjectIndex, startId: markId });
          markId += fallbackRows.length;
          return fallbackRows;
        });
    });
};

const initialMarks = createInitialMarks();

const normalizeExamNameForMark = (row) =>
  String(
    row?.exam_name ??
      row?.examName ??
      row?.exam_type ??
      row?.exam ??
      row?.assessment_name ??
      row?.assessment ??
      row?.test_name ??
      row?.test ??
      row?.term ??
      "General"
  ).trim() || "General";

const buildMarkIdentityKey = (row) => {
  const studentKey = String(row?.student_id ?? row?.studentId ?? row?.studentRoll ?? row?.usn ?? "").trim();
  const subjectKey = String(row?.subject_id ?? row?.subjectId ?? row?.subjectCode ?? row?.subject_code ?? "").trim().toUpperCase();
  const examKey = String(row?.exam_id ?? "").trim() || normalizeExamNameForMark(row);
  return `${studentKey}::${subjectKey}::${examKey}`;
};

const dedupeMarksByIdentity = (rows) => {
  const keepByKey = new Map();
  const duplicateIds = [];

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = buildMarkIdentityKey(row);
    const existing = keepByKey.get(key);

    if (!existing) {
      keepByKey.set(key, row);
      return;
    }

    const currentId = Number(row?.id ?? 0);
    const existingId = Number(existing?.id ?? 0);
    if (currentId >= existingId) {
      if (existing?.id !== undefined && existing?.id !== null) duplicateIds.push(existing.id);
      keepByKey.set(key, row);
      return;
    }

    if (row?.id !== undefined && row?.id !== null) duplicateIds.push(row.id);
  });

  return { rows: Array.from(keepByKey.values()), duplicateIds };
};

const normalizeMarkRowsForUi = (markRows, studentsById, subjectsById) =>
  (Array.isArray(markRows) ? markRows : []).map((row) => {
    const student = studentsById[String(row.student_id)] || {};
    const subject = subjectsById[String(row.subject_id)] || {};
    return {
      id: row.id,
      studentRoll: row.usn || student.roll || String(row.student_id || ""),
      subjectCode: row.subject_code || subject.code || String(row.subject_id || ""),
      examName: String(row.exam_name || "").trim(),
      rawMarks: Number(row.marks_obtained ?? row.rawMarks ?? 0),
      normalized: Number(row.normalized_score ?? row.normalized ?? 0),
    };
  });

const normalizeUploadColumn = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getUploadValue = (row, keys) => {
  const normalized = Object.entries(row || {}).reduce((acc, [key, value]) => {
    acc[normalizeUploadColumn(key)] = value;
    return acc;
  }, {});
  for (const key of keys) {
    const match = normalized[normalizeUploadColumn(key)];
    if (match !== undefined && match !== null && String(match).trim() !== "") return match;
  }
  return "";
};

const deptBadge = (dept) => (dept === "MBBS" ? "dept-badge badge-mbbs" : "dept-badge badge-md");
const rankBadgeClass = (rank) => {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  return "rank-normal";
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [departmentFilter, setDepartmentFilter] = useState("MBBS");
  const [yearFilter, setYearFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");
  const [students, setStudents] = useState(createStudents());
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState(initialMarks);
  const [examOptions, setExamOptions] = useState([]);
  const [examScoresByStudentId, setExamScoresByStudentId] = useState({});

  const [searchStudent, setSearchStudent] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [reportYearFilter, setReportYearFilter] = useState("all");

  const [marksTab, setMarksTab] = useState("add");
  const [method, setMethod] = useState("minmax");
  const [threshold, setThreshold] = useState(50);
  const [methodDesc, setMethodDesc] = useState(methods[1].desc);
  const [toast, setToast] = useState("");
  const [uploadFileName, setUploadFileName] = useState("");
  const [isUploadingMarks, setIsUploadingMarks] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    staff_id: "",
    subject_name: "",
    semester: "",
    academic_year: "",
  });
  const [studentAssignmentForm, setStudentAssignmentForm] = useState({
    staff_id: "",
    department: "MBBS",
    year: "",
    student_ids: [],
    query: "",
  });
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [studentForm, setStudentForm] = useState({ roll: "", name: "", department: "MBBS", year: "Year 1", batch: "2023", api: "" });
  const [staffForm, setStaffForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    department: "MBBS",
    designation: "Professor",
    subjects: [],
  });
  const [subjectForm, setSubjectForm] = useState({ code: "", name: "", department: "MBBS", year: "1st", specialization: "", maxMarks: 100, passMarks: 50, credits: 4 });
  const [marksForm, setMarksForm] = useState({ studentRoll: "", subjectCode: "", examName: DEFAULT_MBBS_EXAM_NAME, rawMarks: "" });

  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingMarkId, setEditingMarkId] = useState(null);
  const [studentSort, setStudentSort] = useState({ key: "rank", direction: "asc" });

  const showToast = useCallback((msg) => setToast(msg), []);

  const adminApiRequest = useCallback(async (path, options = {}) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
        console.error("📡 API Error:", err);
      } catch (e) {
        console.error("📡 API HTTP Error:", response.status, response.statusText);
      }
      throw new Error(message);
    }

    if (response.status === 204) return null;
    return response.json();
  }, []);

  const removeDuplicateMarks = useCallback(
    async (rows) => {
      const { rows: dedupedRows, duplicateIds } = dedupeMarksByIdentity(rows);
      if (duplicateIds.length > 0) {
        await Promise.allSettled(
          duplicateIds.map((id) => adminApiRequest(`/api/admin/marks/${id}`, { method: "DELETE" }))
        );
      }
      return dedupedRows;
    },
    [adminApiRequest]
  );

  const syncMbbsCurriculum = useCallback(
    async (rows) => {
      const existingRows = Array.isArray(rows) ? [...rows] : [];
      const curriculumForSync = [...mbbsSubjects].sort(
        (a, b) => (SUBJECT_YEAR_ORDER[b.year] ?? 0) - (SUBJECT_YEAR_ORDER[a.year] ?? 0)
      );
      const curriculumCodes = new Set(curriculumForSync.map((subject) => String(subject.code || "").trim().toUpperCase()));
      const findMatch = (subject) =>
        existingRows.find(
          (row) =>
            String(row.subject_code || "").trim().toUpperCase() === subject.code ||
            String(row.subject_name || "").trim().toLowerCase() === subject.name.toLowerCase()
        );

      for (const subject of curriculumForSync) {
        const matched = findMatch(subject);
        const payload = {
          subject_code: subject.code,
          subject_name: subject.name,
          max_marks: subject.maxMarks,
          pass_marks: subject.passMarks,
          credits: subject.credits,
          course: "MBBS",
          year: subject.year,
        };

        if (matched) {
          const needsUpdate =
            String(matched.subject_code || "").trim().toUpperCase() !== payload.subject_code ||
            String(matched.subject_name || "").trim() !== payload.subject_name ||
            Number(matched.max_marks ?? 0) !== payload.max_marks ||
            Number(matched.pass_marks ?? subject.passMarks) !== payload.pass_marks ||
            Number(matched.credits ?? subject.credits) !== payload.credits ||
            String(matched.course || matched.department || subject.department).trim().toUpperCase() !== payload.course ||
            String(matched.year || "").trim() !== payload.year;

          if (!needsUpdate) continue;

          const updated = await adminApiRequest(`/api/admin/subjects/${matched.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          const index = existingRows.findIndex((row) => row.id === matched.id);
          if (index >= 0) existingRows[index] = updated;
          continue;
        }

        const created = await adminApiRequest("/api/admin/subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        existingRows.push(created);
      }

      const obsoleteRows = existingRows.filter((row) => {
        const rowCode = String(row.subject_code || "").trim().toUpperCase();
        const rowCourse = String(row.course || row.department || "").trim().toUpperCase();
        return rowCourse === "MBBS" && rowCode && !curriculumCodes.has(rowCode);
      });

      for (const row of obsoleteRows) {
        await adminApiRequest(`/api/admin/subjects/${row.id}`, { method: "DELETE" });
      }

      return existingRows.filter((row) => !obsoleteRows.some((obsolete) => obsolete.id === row.id));
    },
    [adminApiRequest]
  );

  const syncDemoStudentsToDb = useCallback(
    async (rows) => {
      let syncedRows = Array.isArray(rows) ? [...rows] : [];
      let createdAny = false;
      const existingUsns = new Set(syncedRows.map((row) => String(row.usn || "").trim().toUpperCase()).filter(Boolean));

      const demoStudents = createStudents().filter((student) => student.roll && student.name);

      for (const student of demoStudents) {
        const roll = String(student.roll || "").trim().toUpperCase();
        if (!roll || existingUsns.has(roll)) continue;
        await adminApiRequest("/api/admin/students", {
          method: "POST",
          body: JSON.stringify({
            name: student.name,
            email: buildStudentEmailFromName(student.name),
            password: "Student@123",
            usn: roll,
            department: student.department || "MBBS",
            semester: getSemesterFromYearLabel(student.year),
            staff_id: null,
          }),
        });
        existingUsns.add(roll);
        createdAny = true;
      }

      if (createdAny) {
        syncedRows = await adminApiRequest("/api/admin/students");
      }

      return Array.isArray(syncedRows) ? syncedRows : [];
    },
    [adminApiRequest]
  );

  const syncMdSpecializedCatalog = useCallback(
    async (rows) => {
      const existingRows = Array.isArray(rows) ? [...rows] : [];
      const findMatch = (subject) =>
        existingRows.find(
          (row) =>
            String(row.subject_code || "").trim().toUpperCase() === subject.code ||
            (
              String(row.subject_name || "").trim().toLowerCase() === subject.name.toLowerCase() &&
              String(row.specialization || "").trim() === subject.specialization
            )
        );

      for (const subject of mdSpecializedCatalog) {
        const matched = findMatch(subject);
        if (matched) {
          const needsUpdate =
            String(matched.subject_name || "").trim() !== subject.name ||
            String(matched.course || matched.department || "").trim().toUpperCase() !== "MD" ||
            String(matched.year || "").trim() !== subject.year ||
            String(matched.specialization || "").trim() !== subject.specialization ||
            Number(matched.max_marks ?? 0) !== subject.maxMarks ||
            Number(matched.pass_marks ?? 0) !== subject.passMarks ||
            Number(matched.credits ?? 0) !== subject.credits;
          if (!needsUpdate) continue;

          const updated = await adminApiRequest(`/api/admin/subjects/${matched.id}`, {
            method: "PUT",
            body: JSON.stringify({
              subject_code: subject.code,
              subject_name: subject.name,
              max_marks: subject.maxMarks,
              pass_marks: subject.passMarks,
              credits: subject.credits,
              course: "MD",
              year: subject.year,
              specialization: subject.specialization,
            }),
          });

          const index = existingRows.findIndex((row) => row.id === matched.id);
          if (index >= 0) existingRows[index] = updated;
          continue;
        }

        const created = await adminApiRequest("/api/admin/subjects", {
          method: "POST",
          body: JSON.stringify({
            subject_code: subject.code,
            subject_name: subject.name,
            max_marks: subject.maxMarks,
            pass_marks: subject.passMarks,
            credits: subject.credits,
            course: "MD",
            year: subject.year,
            specialization: subject.specialization,
          }),
        });
        existingRows.push(created);
      }

      return existingRows;
    },
    [adminApiRequest]
  );

  const ensureExamForNameAndMaxMarks = useCallback(
    async (examName, maxMarks) => {
      const exams = await adminApiRequest("/api/admin/exams");
      const exactMatch = (Array.isArray(exams) ? exams : []).find(
        (exam) => String(exam.exam_name || "").trim() === examName && Number(exam.max_marks) === Number(maxMarks)
      );
      if (exactMatch) return exactMatch;
      const byName = (Array.isArray(exams) ? exams : []).find(
        (exam) => String(exam.exam_name || "").trim() === examName
      );
      if (byName) {
        return adminApiRequest(`/api/admin/exams/${byName.id}`, {
          method: "PUT",
          body: JSON.stringify({ max_marks: maxMarks }),
        });
      }
      return adminApiRequest("/api/admin/exams", {
        method: "POST",
        body: JSON.stringify({ exam_name: examName, max_marks: maxMarks }),
      });
    },
    [adminApiRequest]
  );

  const syncMbbsMarksToDb = useCallback(
    async ({ studentRows, subjectRows, markRows, examRows }) => {
      const studentsForSync = (Array.isArray(studentRows) ? studentRows : [])
        .filter((student) => student.department === "MBBS" && student.id)
        .sort((a, b) => String(a.roll || "").localeCompare(String(b.roll || "")));
      const allMbbsSubjectRows = (Array.isArray(subjectRows) ? subjectRows : [])
        .filter((subject) => subject.dbId && subject.department === "MBBS");
      const curriculumSubjectCodes = new Set(mbbsSubjects.map((subject) => String(subject.code || "").trim().toUpperCase()));
      const subjectsForSync = allMbbsSubjectRows.filter((subject) =>
        curriculumSubjectCodes.has(String(subject.code || "").trim().toUpperCase())
      );
      const marksForSync = Array.isArray(markRows) ? [...markRows] : [];
      let examsForSync = Array.isArray(examRows) ? [...examRows] : [];
      const shouldResetMbbsMarks =
        typeof window !== "undefined" &&
        window.localStorage.getItem(MBBS_MARKS_SEED_VERSION) !== "done";

      const ensureExam = async (examTemplate) => {
        const existing = examsForSync.find(
          (exam) =>
            String(exam.exam_name || "").trim() === examTemplate.name &&
            Number(exam.max_marks) === Number(examTemplate.maxMarks)
        );
        if (existing) return existing;
        const created = await ensureExamForNameAndMaxMarks(examTemplate.name, examTemplate.maxMarks);
        examsForSync.push(created);
        return created;
      };

      if (shouldResetMbbsMarks) {
        const mbbsStudentIds = new Set(studentsForSync.map((student) => Number(student.id)).filter(Number.isFinite));
        const mbbsSubjectIds = new Set(allMbbsSubjectRows.map((subject) => Number(subject.dbId)).filter(Number.isFinite));
        const marksToDelete = marksForSync.filter(
          (mark) => mbbsStudentIds.has(Number(mark.student_id)) && mbbsSubjectIds.has(Number(mark.subject_id))
        );
        for (const mark of marksToDelete) {
          await adminApiRequest(`/api/admin/marks/${mark.id}`, { method: "DELETE" });
        }
        marksForSync.length = 0;
      }

      for (const [studentIndex, student] of studentsForSync.entries()) {
        const studentYear = MBBS_YEAR_LABEL_MAP[String(student.year || "").trim()] || "";
        const yearSubjects = subjectsForSync
          .filter((subject) => String(subject.year || "").trim() === studentYear)
          .sort((a, b) => a.code.localeCompare(b.code));

        for (const [subjectIndex, subject] of yearSubjects.entries()) {
          const demoRows = buildMbbsDemoExamRows({
            studentRoll: student.roll,
            subjectCode: subject.code,
          });
          const sourceRows = demoRows.length > 0
            ? demoRows
            : buildFallbackMbbsExamRows({ student, studentIndex, subject, subjectIndex });

          for (const row of sourceRows) {
            const examTemplate = MBBS_EXAM_STRUCTURE.find((exam) => exam.name === row.examName);
            if (!examTemplate) continue;
            const exam = await ensureExam(examTemplate);
            const marksObtained = Math.max(0, Math.min(Number(row.rawMarks), Number(examTemplate.maxMarks)));
            const existing = marksForSync.find(
              (mark) =>
                Number(mark.student_id) === Number(student.id) &&
                Number(mark.subject_id) === Number(subject.dbId) &&
                Number(mark.exam_id) === Number(exam.id)
            );

            if (existing) {
              if (Number(existing.marks_obtained) === Number(marksObtained)) continue;
              const updated = await adminApiRequest(`/api/admin/marks/${existing.id}`, {
                method: "PUT",
                body: JSON.stringify({ marks_obtained: marksObtained }),
              });
              const existingIndex = marksForSync.findIndex((mark) => mark.id === existing.id);
              if (existingIndex >= 0) {
                marksForSync[existingIndex] = { ...marksForSync[existingIndex], ...updated, marks_obtained: marksObtained, exam_id: exam.id };
              }
              continue;
            }

            const created = await adminApiRequest("/api/admin/marks", {
              method: "POST",
              body: JSON.stringify({
                student_id: student.id,
                subject_id: subject.dbId,
                exam_id: exam.id,
                marks_obtained: marksObtained,
              }),
          });
            marksForSync.push(created);
          }
        }
      }

      if (shouldResetMbbsMarks && typeof window !== "undefined") {
        window.localStorage.setItem(MBBS_MARKS_SEED_VERSION, "done");
      }
    },
    [adminApiRequest, ensureExamForNameAndMaxMarks]
  );

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (examFilter === "all") return;
    if (examOptions.includes(examFilter)) return;
    setExamFilter("all");
  }, [examOptions, examFilter]);

  useEffect(() => {
    const run = async () => {
      try {
        const [staffRows, studentRows, marksRows, examRows] = await Promise.all([
          adminApiRequest("/api/admin/staff"),
          adminApiRequest("/api/admin/students"),
          adminApiRequest("/api/admin/marks"),
          adminApiRequest("/api/admin/exams"),
        ]);

        const safeStudentRows = await syncDemoStudentsToDb(Array.isArray(studentRows) ? studentRows : []);
        const safeMarksRows = await removeDuplicateMarks(Array.isArray(marksRows) ? marksRows : []);
        const scoreAggByStudentId = safeMarksRows.reduce((acc, row) => {
          const studentId = String(row.student_id ?? "");
          if (!studentId) return acc;
          const normalized = Number(row.normalized_score ?? row.normalized ?? row.api);
          if (!Number.isFinite(normalized)) return acc;
          const prev = acc[studentId] || { sum: 0, count: 0 };
          acc[studentId] = { sum: prev.sum + normalized, count: prev.count + 1 };
          return acc;
        }, {});
        const examAggByStudentId = safeMarksRows.reduce((acc, row) => {
          const studentId = String(row.student_id ?? "");
          if (!studentId) return acc;
          const normalized = Number(row.normalized_score ?? row.normalized ?? row.api);
          if (!Number.isFinite(normalized)) return acc;
          const exam = normalizeExamNameForMark(row);
          if (!acc[studentId]) acc[studentId] = {};
          const prev = acc[studentId][exam] || { sum: 0, count: 0 };
          acc[studentId][exam] = { sum: prev.sum + normalized, count: prev.count + 1 };
          return acc;
        }, {});
        const examScores = Object.entries(examAggByStudentId).reduce((acc, [studentId, examAgg]) => {
          acc[studentId] = Object.entries(examAgg).reduce((examAcc, [exam, value]) => {
            examAcc[exam] = value.sum / value.count;
            return examAcc;
          }, {});
          return acc;
        }, {});
        const exams = Array.from(
          new Set(
            safeMarksRows
              .map((row) => normalizeExamNameForMark(row))
              .filter((name) => Boolean(String(name || "").trim()))
          )
        ).sort((a, b) => a.localeCompare(b));
        setExamScoresByStudentId(examScores);
        setExamOptions(exams);

        const assignedStudentsByStaffId = safeStudentRows.reduce((acc, row) => {
          const staffId = String(row.staff_id ?? "");
          if (!staffId) return acc;
          if (!acc[staffId]) acc[staffId] = [];
          acc[staffId].push(row);
          return acc;
        }, {});

        const deptCounters = { MD: 0, MBBS: 0 };
        const normalizedStudents = safeStudentRows.map((row) => {
          const department = normalizeDepartment(row.department);
          const roll = buildStudentRollNo(row, department, deptCounters, row.usn);
          const scoreEntry = scoreAggByStudentId[String(row.id)];
          const scoreFromMarks = scoreEntry ? scoreEntry.sum / scoreEntry.count : null;
          const apiRaw = row.api ?? row.final_score;
          const apiParsedRaw = apiRaw === undefined || apiRaw === null || apiRaw === "" ? null : Number(apiRaw);
          const normalizedScore = Number.isFinite(scoreFromMarks) ? scoreFromMarks : apiParsedRaw;

          const derivedYear = getYearLabelFromSemester(row.semester);
          return {
            id: row.id,
            roll,
            name: String(row.name || ""),
            department,
            year: row.year ?? derivedYear,
            batch: batchFromRoll(roll) || deriveBatch(row, roll),
            api: Number.isFinite(normalizedScore) ? Number(normalizedScore.toFixed(2)) : 0,
            rank: 0,
            hasApi: Number.isFinite(normalizedScore),
            hasRank: false,
            status: "active",
          };
        });

        const rankByRoll = new Map();
        ["MBBS", "MD"].forEach((dept) => {
          const rankedByDept = normalizedStudents
            .filter((s) => s.hasApi && s.department === dept)
            .sort((a, b) => b.api - a.api);
          rankedByDept.forEach((s, index) => {
            rankByRoll.set(s.roll, index + 1);
          });
        });
        const studentsWithRank = normalizedStudents.map((s) => ({
          ...s,
          rank: rankByRoll.get(s.roll) || 0,
          hasRank: rankByRoll.has(s.roll),
        }));
        setStudents(studentsWithRank);
        const studentsById = studentsWithRank.reduce((acc, row) => {
          acc[String(row.id)] = row;
          return acc;
        }, {});

        const safeStaffRows = Array.isArray(staffRows) ? staffRows : [];

        // Primary requirement: always list DB staff rows in Staff Management.
        const normalizedStaff = safeStaffRows.map((row) => {
          const assignedStudents = assignedStudentsByStaffId[String(row.id)] || [];
          const assignedStudentYears = getAssignedYearLabels(assignedStudents);
          const assignedStudentDetails = buildAssignedStudentDetails(assignedStudents);

          return {
            assignedStudentsCount: assignedStudents.length,
            assignedStudentYears,
            assignedStudents: assignedStudentDetails,
            ...row,
            name: row.name || row.staff_name || row.email || `Staff ${row.id}`,
            department: normalizeDepartmentFromStaffRow(row),
            designation: row.designation || "Professor",
            status:
              row.status ||
              (assignedStudents.length > 0 ? `${assignedStudents.length} students assigned` : "active"),
            subjects: Array.isArray(row.subjects) ? row.subjects : [],
          };
        });
        setStaff(normalizedStaff);

        const normalizeSubjectRow = (row) => {
          const name = String(row.subject_name || row.name || "").trim();
          const nameMeta = SUBJECT_META_BY_NAME[name.toLowerCase()] || {};
          const code = String(row.subject_code || row.code || nameMeta.code || "").toUpperCase();
          const meta = SUBJECT_META_BY_CODE[code] || nameMeta;
          const derivedDepartment = code.startsWith("MD") ? "MD" : code.startsWith("MBBS") ? "MBBS" : "";
          return {
            dbId: row.id,
            code,
            name,
            department: meta.department || row.course || row.department || derivedDepartment || "MBBS",
            year: String(row.year || meta.year || "").trim(),
            specialization: String(row.specialization || meta.specialization || "").trim(),
            maxMarks: Number(row.max_marks ?? row.maxMarks ?? meta.maxMarks ?? 0),
            passMarks: Number(row.pass_marks ?? row.passMarks ?? meta.passMarks ?? 50),
            credits: Number(row.credits ?? meta.credits ?? 4),
          };
        };

        // Load subjects independently so Subject tab still works even if assignment API fails.
        let safeSubjectRows = [];
        try {
          const subjectRows = await adminApiRequest("/api/admin/subjects");
          safeSubjectRows = Array.isArray(subjectRows) ? subjectRows : [];
          let normalizedSubjects = safeSubjectRows.map(normalizeSubjectRow);

          if (normalizedSubjects.length > 0) {
            setSubjects(normalizedSubjects);
            setSubjectOptions(
              normalizedSubjects
                .map(toSubjectOption)
                .filter((subject) => Number.isInteger(Number(subject.id)) && Number(subject.id) > 0)
            );
          }

          try {
            safeSubjectRows = await syncMbbsCurriculum(safeSubjectRows);
            safeSubjectRows = await syncMdSpecializedCatalog(safeSubjectRows);
            normalizedSubjects = safeSubjectRows.map(normalizeSubjectRow);
            if (normalizedSubjects.length > 0) {
              setSubjects(normalizedSubjects);
              setSubjectOptions(
                normalizedSubjects
                  .map(toSubjectOption)
                  .filter((subject) => Number.isInteger(Number(subject.id)) && Number(subject.id) > 0)
              );
            }
          } catch {
            // Keep already loaded DB subjects visible even if sync fails.
          }

          if (normalizedSubjects.length === 0) {
            setSubjects([...mbbsSubjects, ...mdSubjects, ...mdSpecializedCatalog].map(normalizeSubjectRow));
          }

          const subjectsById = normalizedSubjects.reduce((acc, row) => {
            acc[String(row.dbId)] = row;
            return acc;
          }, {});

          try {
            await syncMbbsMarksToDb({
              studentRows: studentsWithRank,
              subjectRows: normalizedSubjects,
              markRows: safeMarksRows,
              examRows,
            });

            const persistedMarks = await removeDuplicateMarks(await adminApiRequest("/api/admin/marks"));
            setMarks(normalizeMarkRowsForUi(persistedMarks, studentsById, subjectsById));
            setExamOptions(
              Array.from(
                new Set(
                  (Array.isArray(persistedMarks) ? persistedMarks : [])
                    .map((row) => normalizeExamNameForMark(row))
                    .filter(Boolean)
                )
              ).sort((a, b) => a.localeCompare(b))
            );
          } catch {
            setMarks(initialMarks);
          }
        } catch {
          const fallbackSubjects = [...mbbsSubjects, ...mdSubjects, ...mdSpecializedCatalog].map(normalizeSubjectRow);
          setSubjects(fallbackSubjects);
          setSubjectOptions(fallbackSubjects.map(toSubjectOption));
          setMarks(initialMarks);
        }

        // Optional assignment data.
        try {
          const assignmentRows = await adminApiRequest("/api/admin/staff-subjects");
          const subjectsByStaffId = buildUniqueSubjectsByStaffId(assignmentRows);

          setStaff((prev) =>
            prev.map((row) => ({
              ...row,
              subjects: Array.from(subjectsByStaffId[String(row.id)] || []),
            }))
          );
        } catch {
          // Keep staff and subjects visible even if assignment endpoint fails.
        }
      } catch (error) {
        showToast(error.message || "Failed to load staff");
      }
    };
    run();
  }, [adminApiRequest, removeDuplicateMarks, showToast, syncDemoStudentsToDb, syncMbbsCurriculum, syncMdSpecializedCatalog, syncMbbsMarksToDb]);

  const recalcRanks = (arr) => {
    const rankByRoll = new Map();
    ["MBBS", "MD"].forEach((dept) => {
      const rankedByDept = [...arr]
        .filter((s) => Number.isFinite(Number(s.api)) && s.department === dept)
        .sort((a, b) => Number(b.api) - Number(a.api));
      rankedByDept.forEach((s, index) => {
        rankByRoll.set(s.roll, index + 1);
      });
    });
    return arr.map((s) => ({
      ...s,
      rank: rankByRoll.get(s.roll) || 0,
      hasRank: rankByRoll.has(s.roll),
    }));
  };

  const yearFilterLevel =
    yearFilter === "all"
      ? null
      : Number(String(yearFilter).replace("year", "").trim());
  const matchesDepartmentAndYearFilter = useCallback(
    (student) => {
      const departmentMatch = departmentFilter === "all" ? true : student.department === departmentFilter;
      if (!departmentMatch) return false;
      if (!Number.isFinite(yearFilterLevel)) return true;
      return getYearLevel(student) === yearFilterLevel;
    },
    [departmentFilter, yearFilterLevel]
  );

  const filteredStudents = useMemo(() => {
    const q = searchStudent.trim().toLowerCase();
    return students
      .filter((s) => matchesDepartmentAndYearFilter(s))
      .filter((s) => !q || String(s.name || "").toLowerCase().includes(q) || String(s.roll || "").toLowerCase().includes(q))
      .sort((a, b) => {
        const direction = studentSort.direction === "desc" ? -1 : 1;
        const compareText = (left, right) => String(left || "").localeCompare(String(right || ""));
        const compareNumber = (left, right) => Number(left || 0) - Number(right || 0);

        let result = 0;
        switch (studentSort.key) {
          case "roll":
            result = compareText(a.roll, b.roll);
            break;
          case "name":
            result = compareText(a.name, b.name);
            break;
          case "department":
            result = compareText(a.department, b.department);
            break;
          case "year":
            result = compareNumber(getYearLevel(a), getYearLevel(b)) || compareText(a.year, b.year);
            break;
          case "batch":
            result = compareText(a.batch, b.batch);
            break;
          case "api":
            result = compareNumber(a.api, b.api);
            break;
          case "rank":
            result = compareNumber(a.rank || Number.MAX_SAFE_INTEGER, b.rank || Number.MAX_SAFE_INTEGER);
            break;
          default:
            result = compareText(a.name, b.name);
            break;
        }

        if (result !== 0) return result * direction;
        return compareText(a.roll, b.roll);
      });
  }, [students, matchesDepartmentAndYearFilter, searchStudent, studentSort]);

  const filteredStaff = useMemo(() => {
    const q = searchStaff.trim().toLowerCase();
    return staff
      .filter((s) => (departmentFilter === "all" ? true : s.department === departmentFilter))
      .filter(
        (s) =>
          !q ||
          String(s.name || "").toLowerCase().includes(q) ||
          String(s.id || "").toLowerCase().includes(q)
      );
  }, [staff, departmentFilter, searchStaff]);

  const filteredSubjectOptions = useMemo(() => {
    const selectedStaff = staff.find((row) => String(row.id) === String(assignmentForm.staff_id));
    const targetDepartment = String(selectedStaff?.department || "").trim().toUpperCase();
    const baseOptions = subjectOptions.filter((subject) => Number.isInteger(Number(subject.id)) && Number(subject.id) > 0);
    if (!targetDepartment) return baseOptions;
    return baseOptions.filter((subject) => subject.department === targetDepartment);
  }, [assignmentForm.staff_id, staff, subjectOptions, subjects]);

  const assignYearLevelFilter = studentAssignmentForm.year ? Number(studentAssignmentForm.year) : null;
  const assignStudentOptions = useMemo(() => {
    const query = String(studentAssignmentForm.query || "").trim().toLowerCase();
    return students
      .filter((student) => student.department === studentAssignmentForm.department)
      .filter((student) => (Number.isFinite(assignYearLevelFilter) ? getYearLevel(student) === assignYearLevelFilter : true))
      .filter((student) => {
        if (!query) return true;
        return (
          String(student.name || "").toLowerCase().includes(query) ||
          String(student.roll || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => String(a.roll || "").localeCompare(String(b.roll || "")));
  }, [students, studentAssignmentForm.department, studentAssignmentForm.query, assignYearLevelFilter]);

  const filteredSubjects = useMemo(() => {
    const q = searchSubject.trim().toLowerCase();
    return subjects
      .filter((s) => (departmentFilter === "all" ? true : s.department === departmentFilter))
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.department !== b.department) return a.department.localeCompare(b.department);
        const aYear = SUBJECT_YEAR_ORDER[a.year] ?? Number.MAX_SAFE_INTEGER;
        const bYear = SUBJECT_YEAR_ORDER[b.year] ?? Number.MAX_SAFE_INTEGER;
        if (aYear !== bYear) return aYear - bYear;
        return a.code.localeCompare(b.code);
      });
  }, [subjects, departmentFilter, searchSubject]);

  const baseSubjects = useMemo(
    () =>
      filteredSubjects.filter((subject) => {
        const code = String(subject.code || "").toUpperCase();
        return !code.startsWith("MD-") && !/^MD\d{3}$/.test(code) && !/^MD[A-Z]{2}\d{3}$/.test(code);
      }),
    [filteredSubjects]
  );

  const overviewStudents = useMemo(() => {
    const baseByFilters = students.filter((student) => matchesDepartmentAndYearFilter(student));
    const base = examFilter === "all"
      ? baseByFilters
      : baseByFilters
          .map((student) => {
            const score = examScoresByStudentId[String(student.id)]?.[examFilter];
            if (!Number.isFinite(score)) return null;
            return {
              ...student,
              api: Number(score.toFixed(2)),
            };
          })
          .filter(Boolean);

    const rankByRoll = new Map();
    ["MBBS", "MD"].forEach((dept) => {
      const rankedByDept = [...base]
        .filter((s) => Number.isFinite(Number(s.api)) && s.department === dept)
        .sort((a, b) => Number(b.api) - Number(a.api));
      rankedByDept.forEach((s, index) => {
        rankByRoll.set(s.roll, index + 1);
      });
    });
    return base.map((student) => ({
      ...student,
      rank: rankByRoll.get(student.roll) || 0,
      hasRank: rankByRoll.has(student.roll),
    }));
  }, [students, examFilter, examScoresByStudentId, matchesDepartmentAndYearFilter]);

  const topTen = useMemo(() => {
    const reportYearLevel =
      reportYearFilter === "all"
        ? NaN
        : Number(String(reportYearFilter).replace("year", "").trim());
    const base = Number.isFinite(reportYearLevel)
      ? students.filter((student) => getYearLevel(student) === reportYearLevel)
      : students;
    return [...base].sort((a, b) => b.api - a.api).slice(0, 10);
  }, [students, reportYearFilter]);

  const stats = useMemo(() => {
    const totalStudents = overviewStudents.length;
    const mbbs = overviewStudents.filter((s) => s.department === "MBBS").length;
    const md = overviewStudents.filter((s) => s.department === "MD").length;
    const highest = totalStudents ? Math.max(...overviewStudents.map((s) => s.api)) : 0;
    const classAvg = totalStudents ? overviewStudents.reduce((sum, s) => sum + s.api, 0) / totalStudents : 0;
    const failed = overviewStudents.filter((s) => s.api < threshold).length;
    const passPercentage = totalStudents ? ((totalStudents - failed) / totalStudents) * 100 : 0;
    return {
      totalStudents,
      mbbs,
      md,
      staff: staff.length,
      subjects: subjects.filter((subject) => subject.department === "MBBS").length,
      classAvg: Number(classAvg.toFixed(2)),
      highest: Number(highest.toFixed(2)),
      failed,
      passPercentage: Number(passPercentage.toFixed(1)),
      departments: 1,
    };
  }, [overviewStudents, staff.length, subjects, threshold]);

  const distribution = useMemo(() => {
    return {
      excellent: overviewStudents.filter((s) => s.api >= 85).length,
      good: overviewStudents.filter((s) => s.api >= 75 && s.api < 85).length,
      average: overviewStudents.filter((s) => s.api >= 60 && s.api < 75).length,
      low: overviewStudents.filter((s) => s.api >= 50 && s.api < 60).length,
      failed: overviewStudents.filter((s) => s.api < 50).length,
    };
  }, [overviewStudents]);

  const handleStudentSave = async () => {
    const api = Number(studentForm.api);
    if (!studentForm.roll || !studentForm.name || Number.isNaN(api)) {
      showToast("Enter valid student details");
      return;
    }
    const roll = String(studentForm.roll || "").trim().toUpperCase();
    const computedBatch = batchFromRoll(roll) || studentForm.batch;
    const nextStudent = { ...studentForm, roll, batch: computedBatch, api, status: "active" };
    const existingStudent = students.find((student) => student.id === editingStudent || student.roll === editingStudent);
    const semester = getSemesterFromYearLabel(nextStudent.year);
    const email = buildStudentEmailFromName(nextStudent.name);

    try {
      if (existingStudent?.id) {
        const updated = await adminApiRequest(`/api/admin/students/${existingStudent.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: nextStudent.name,
            email,
            usn: nextStudent.roll,
            department: nextStudent.department,
            semester,
          }),
        });

        setStudents((prev) =>
          recalcRanks(
            prev.map((student) =>
              student.id === existingStudent.id || student.roll === existingStudent.roll
                ? {
                    ...student,
                    ...nextStudent,
                    id: Number(updated.id ?? student.id),
                    year: getYearLabelFromSemester(updated.semester) || nextStudent.year,
                  }
                : student
            )
          )
        );
        setEditingStudent(null);
        showToast("Student updated");
      } else {
        const created = await adminApiRequest("/api/admin/students", {
          method: "POST",
          body: JSON.stringify({
            name: nextStudent.name,
            email,
            password: "Student@123",
            usn: nextStudent.roll,
            department: nextStudent.department,
            semester,
            staff_id: null,
          }),
        });

        setStudents((prev) =>
          recalcRanks([
            ...prev,
            {
              ...nextStudent,
              id: Number(created?.student?.id ?? created?.id ?? prev.length + 1),
              year: getYearLabelFromSemester(created?.student?.semester) || nextStudent.year,
              rank: prev.length + 1,
            },
          ])
        );
        showToast(`Student added. Login: ${email} / Student@123`);
      }

      setStudentForm({ roll: "", name: "", department: "MBBS", year: "Year 1", batch: "2023", api: "" });
    } catch (error) {
      showToast(error.message || "Failed to save student");
    }
  };

  const handleStaffSave = async () => {
    if (!staffForm.id || !staffForm.name) {
      showToast("Enter valid staff details");
      return;
    }

    // UI keeps "Staff ID" field for display consistency; backend owns actual DB id.
    const email = `staff${staffForm.id}@local.test`;
    const password = "Staff@123";
    try {
      if (editingStaff) {
        const updated = await adminApiRequest(`/api/admin/staff/${editingStaff}`, {
          method: "PUT",
          body: JSON.stringify({ name: staffForm.name, email, department: staffForm.department }),
        });
        setStaff((prev) =>
          prev.map((s) =>
            s.id === editingStaff
              ? { ...s, ...updated, department: staffForm.department, designation: staffForm.designation }
              : s
          )
        );
        setEditingStaff(null);
        showToast("Staff updated in DB");
      } else {
        const created = await adminApiRequest("/api/admin/staff", {
          method: "POST",
          body: JSON.stringify({
            name: staffForm.name,
            email,
            password,
            staff_id: Number(staffForm.id),
            department: staffForm.department,
          }),
        });
        const createdStaff = created?.staff || created;
        setStaff((prev) => [
          ...prev,
          {
            ...createdStaff,
            department: staffForm.department,
            designation: staffForm.designation,
            status: "active",
            subjects: [],
          },
        ]);
        showToast(`Staff added in DB (assigned ID: ${createdStaff.id})`);
      }
      setStaffForm({ id: "", name: "", email: "", password: "", department: "MBBS", designation: "Professor", subjects: [] });
    } catch (error) {
      showToast(error.message || "Failed to save staff");
    }
  };

  const handleSubjectSave = async () => {
    if (!subjectForm.code || !subjectForm.name) {
      showToast("Enter valid subject details");
      return;
    }

    const next = {
      ...subjectForm,
      maxMarks: Number(subjectForm.maxMarks),
      passMarks: Number(subjectForm.passMarks),
      credits: Number(subjectForm.credits),
      specialization: String(subjectForm.specialization || "").trim(),
    };

    try {
      if (editingSubject) {
        const updated = await adminApiRequest(`/api/admin/subjects/${editingSubject}`, {
          method: "PUT",
          body: JSON.stringify({
            subject_code: next.code,
            subject_name: next.name,
            max_marks: next.maxMarks,
            pass_marks: next.passMarks,
            credits: next.credits,
            course: next.department,
            year: next.year,
            specialization: next.specialization,
          }),
        });
        const merged = {
          dbId: updated.id,
          code: updated.subject_code || next.code,
          name: updated.subject_name || next.name,
          department: updated.course || next.department,
          year: updated.year || next.year,
          specialization: updated.specialization || next.specialization,
          maxMarks: Number(updated.max_marks ?? next.maxMarks),
          passMarks: Number(updated.pass_marks ?? next.passMarks),
          credits: Number(updated.credits ?? next.credits),
        };
        setSubjects((prev) => prev.map((s) => (s.dbId === editingSubject ? merged : s)));
        setSubjectOptions((prev) =>
          prev.map((s) => (s.id === editingSubject ? toSubjectOption(merged) : s)).filter((s) => Number.isInteger(Number(s.id)) && Number(s.id) > 0)
        );
        setEditingSubject(null);
        showToast("Subject updated");
      } else {
        const created = await adminApiRequest("/api/admin/subjects", {
          method: "POST",
          body: JSON.stringify({
            subject_code: next.code,
            subject_name: next.name,
            max_marks: next.maxMarks,
            pass_marks: next.passMarks,
            credits: next.credits,
            course: next.department,
            year: next.year,
            specialization: next.specialization,
          }),
        });
        setSubjects((prev) => [
          ...prev,
          {
            dbId: created.id,
            code: created.subject_code || next.code,
            name: created.subject_name || next.name,
            department: created.course || next.department,
            year: created.year || next.year,
            specialization: created.specialization || next.specialization,
            maxMarks: Number(created.max_marks ?? next.maxMarks),
            passMarks: Number(created.pass_marks ?? next.passMarks),
            credits: Number(created.credits ?? next.credits),
          },
        ]);
        setSubjectOptions((prev) => [...prev, toSubjectOption(created)].filter((s) => Number.isInteger(Number(s.id)) && Number(s.id) > 0));
        showToast("Subject added");
      }

      setSubjectForm({ code: "", name: "", department: "MBBS", year: "1st", specialization: "", maxMarks: 100, passMarks: 50, credits: 4 });
    } catch (error) {
      showToast(error.message || "Failed to save subject");
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await adminApiRequest(`/api/admin/subjects/${subjectId}`, { method: "DELETE" });
      setSubjects((prev) => prev.filter((x) => x.dbId !== subjectId));
      setSubjectOptions((prev) => prev.filter((x) => x.id !== subjectId));
      showToast("Subject deleted");
    } catch (error) {
      showToast(error.message || "Failed to delete subject");
    }
  };

  const handleMarksSave = async () => {
    const raw = Number(marksForm.rawMarks);
    const examTemplate = MBBS_EXAM_STRUCTURE.find((exam) => exam.name === marksForm.examName);
    if (!marksForm.studentRoll || !marksForm.subjectCode || !marksForm.examName || Number.isNaN(raw) || !examTemplate) {
      showToast("Enter marks details");
      return;
    }
    if (raw < 0 || raw > examTemplate.maxMarks) {
      showToast(`Marks must be between 0 and ${examTemplate.maxMarks} for ${examTemplate.name}`);
      return;
    }

    const student = students.find((s) => s.roll === marksForm.studentRoll);
    const sub = subjects.find((s) => s.code === marksForm.subjectCode);
    if (!student || !sub?.dbId) {
      showToast("Student or subject not found");
      return;
    }

    try {
      if (editingMarkId) {
        const updated = await adminApiRequest(`/api/admin/marks/${editingMarkId}`, {
          method: "PUT",
          body: JSON.stringify({ marks_obtained: raw }),
        });
        setMarks((prev) =>
          prev.map((m) =>
            m.id === editingMarkId
              ? {
                  ...m,
                  studentRoll: marksForm.studentRoll,
                  subjectCode: marksForm.subjectCode,
                  examName: marksForm.examName,
                  rawMarks: raw,
                  normalized: Number(updated.normalized_score ?? m.normalized),
                }
              : m
          )
        );
        setEditingMarkId(null);
        showToast("Marks updated");
      } else {
        const existingMark = marks.find(
          (mark) =>
            mark.studentRoll === marksForm.studentRoll &&
            mark.subjectCode === marksForm.subjectCode &&
            String(mark.examName || "").trim() === String(marksForm.examName || "").trim()
        );

        if (existingMark?.id) {
          const updated = await adminApiRequest(`/api/admin/marks/${existingMark.id}`, {
            method: "PUT",
            body: JSON.stringify({ marks_obtained: raw }),
          });
          setMarks((prev) =>
            prev.map((mark) =>
              mark.id === existingMark.id
                ? {
                    ...mark,
                    rawMarks: raw,
                    normalized: Number(updated.normalized_score ?? mark.normalized),
                  }
                : mark
            )
          );
          showToast("Duplicate marks updated");
          setMarksForm({ studentRoll: "", subjectCode: "", examName: DEFAULT_MBBS_EXAM_NAME, rawMarks: "" });
          return;
        }

        const exam = await ensureExamForNameAndMaxMarks(examTemplate.name, examTemplate.maxMarks);
        const created = await adminApiRequest("/api/admin/marks", {
          method: "POST",
          body: JSON.stringify({
            student_id: student.id,
            subject_id: sub.dbId,
            exam_id: exam.id,
            marks_obtained: raw,
          }),
        });
        setMarks((prev) => [
          {
            id: created.id,
            studentRoll: marksForm.studentRoll,
            subjectCode: marksForm.subjectCode,
            examName: marksForm.examName,
            rawMarks: raw,
            normalized: Number(created.normalized_score ?? 0),
          },
          ...prev,
        ]);
        showToast("Marks added");
      }

      setMarksForm({ studentRoll: "", subjectCode: "", examName: DEFAULT_MBBS_EXAM_NAME, rawMarks: "" });
    } catch (error) {
      showToast(error.message || "Failed to save marks");
    }
  };

  const handleDeleteMark = async (markId) => {
    try {
      await adminApiRequest(`/api/admin/marks/${markId}`, { method: "DELETE" });
      setMarks((prev) => prev.filter((x) => x.id !== markId));
      showToast("Marks deleted");
    } catch (error) {
      showToast(error.message || "Failed to delete marks");
    }
  };

  const handleMarksUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploadFileName(file.name);
      setIsUploadingMarks(true);

      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error("The uploaded sheet is empty");
        }

        const studentsByRoll = students.reduce((acc, student) => {
          const roll = String(student.roll || "").trim().toUpperCase();
          if (roll) acc[roll] = student;
          return acc;
        }, {});
        const subjectsByCode = subjects.reduce((acc, subject) => {
          const code = String(subject.code || "").trim().toUpperCase();
          if (code) acc[code] = subject;
          return acc;
        }, {});

        const marksRows = await removeDuplicateMarks(await adminApiRequest("/api/admin/marks"));
        const marksIndex = new Map(
          marksRows.map((row) => [
            `${String(row.student_id)}::${String(row.subject_id)}::${String(row.exam_id)}`,
            row,
          ])
        );

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
          const studentRoll = String(
            getUploadValue(row, ["studentRoll", "student_roll", "rollNo", "roll_no", "usn"])
          ).trim().toUpperCase();
          const subjectCode = String(
            getUploadValue(row, ["subjectCode", "subject_code", "code"])
          ).trim().toUpperCase();
          const examName = String(
            getUploadValue(row, ["examName", "exam_name", "exam"])
          ).trim();
          const rawMarksValue = getUploadValue(row, ["rawMarks", "raw_marks", "marksObtained", "marks_obtained", "marks"]);
          const rawMarks = Number(rawMarksValue);

          if (!studentRoll && !subjectCode && !examName && String(rawMarksValue).trim() === "") {
            skippedCount += 1;
            continue;
          }

          const student = studentsByRoll[studentRoll];
          const subject = subjectsByCode[subjectCode];
          const examTemplate = MBBS_EXAM_STRUCTURE.find(
            (exam) => normalizeUploadColumn(exam.name) === normalizeUploadColumn(examName)
          );

          if (!student || !subject?.dbId || !examTemplate || !Number.isFinite(rawMarks)) {
            skippedCount += 1;
            continue;
          }

          const boundedMarks = Math.max(0, Math.min(rawMarks, Number(examTemplate.maxMarks)));
          const exam = await ensureExamForNameAndMaxMarks(examTemplate.name, examTemplate.maxMarks);
          const identityKey = `${String(student.id)}::${String(subject.dbId)}::${String(exam.id)}`;
          const existing = marksIndex.get(identityKey);

          if (existing?.id) {
            const currentMarks = Number(existing.marks_obtained);
            if (currentMarks !== boundedMarks) {
              const updated = await adminApiRequest(`/api/admin/marks/${existing.id}`, {
                method: "PUT",
                body: JSON.stringify({ marks_obtained: boundedMarks }),
              });
              marksIndex.set(identityKey, { ...existing, ...updated, marks_obtained: boundedMarks });
              updatedCount += 1;
            } else {
              skippedCount += 1;
            }
            continue;
          }

          const created = await adminApiRequest("/api/admin/marks", {
            method: "POST",
            body: JSON.stringify({
              student_id: student.id,
              subject_id: subject.dbId,
              exam_id: exam.id,
              marks_obtained: boundedMarks,
            }),
          });
          marksIndex.set(identityKey, created);
          createdCount += 1;
        }

        const refreshedMarks = await removeDuplicateMarks(await adminApiRequest("/api/admin/marks"));
        const studentsById = students.reduce((acc, row) => {
          acc[String(row.id)] = row;
          return acc;
        }, {});
        const subjectsById = subjects.reduce((acc, row) => {
          acc[String(row.dbId)] = row;
          return acc;
        }, {});
        setMarks(normalizeMarkRowsForUi(refreshedMarks, studentsById, subjectsById));
        showToast(`Upload finished: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`);
      } catch (error) {
        showToast(error.message || "Failed to upload marks");
      } finally {
        setIsUploadingMarks(false);
        event.target.value = "";
      }
    },
    [adminApiRequest, ensureExamForNameAndMaxMarks, removeDuplicateMarks, showToast, students, subjects]
  );

  const deleteWithConfirm = (text, cb) => {
    if (!window.confirm(text)) return;
    cb();
  };

  const toggleStaffSubject = (subjectName) => {
    setStaffForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectName)
        ? prev.subjects.filter((s) => s !== subjectName)
        : [...prev.subjects, subjectName],
    }));
  };

  const downloadTemplate = () => {
    const blob = new Blob(["studentRoll,subjectCode,examName,rawMarks"], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marks-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Template downloaded");
  };

  const getReportPayload = useCallback((reportName = "Report") => {
    const name = String(reportName || "Report");

    if (name === "Merit List" || name === "Merit List Full") {
      const meritRows = (name === "Merit List" ? topTen : [...students].sort((a, b) => b.api - a.api)).map((student, index) => ({
        Rank: index + 1,
        Roll: student.roll,
        Name: student.name,
        Department: student.department,
        Year: getStudentYearLabel(student),
        "Normalized Score": Number(student.api || 0).toFixed(2),
      }));
      return {
        title: name,
        rows: meritRows,
        emptyRow: { Message: "No merit data available" },
      };
    }

    if (name === "Subject Report") {
      const bySubject = marks.reduce((acc, mark) => {
        const code = String(mark.subjectCode || "");
        if (!code) return acc;
        const raw = Number(mark.rawMarks);
        const normalized = Number(mark.normalized ?? mark.normalized_score);
        const prev = acc[code] || { count: 0, rawSum: 0, normSum: 0 };
        acc[code] = {
          count: prev.count + 1,
          rawSum: prev.rawSum + (Number.isFinite(raw) ? raw : 0),
          normSum: prev.normSum + (Number.isFinite(normalized) ? normalized : 0),
        };
        return acc;
      }, {});
      return {
        title: "Subject Report",
        rows: Object.entries(bySubject).map(([code, value]) => ({
          "Subject Code": code,
          "Subject Name": subjects.find((subject) => subject.code === code)?.name || code,
          Students: value.count,
          "Average Raw": value.count ? (value.rawSum / value.count).toFixed(2) : "0.00",
          "Average Normalized": value.count ? (value.normSum / value.count).toFixed(2) : "0.00",
        })),
        emptyRow: { Message: "No subject marks data available" },
      };
    }

    if (name === "Class Summary") {
      return {
        title: "Class Summary",
        rows: [
          { Metric: "Total Students", Value: overviewStudents.length },
          { Metric: "MBBS Students", Value: stats.mbbs },
          { Metric: "MD Students", Value: stats.md },
          { Metric: "Passed Students", Value: overviewStudents.length - stats.failed },
          { Metric: "Failed Students", Value: stats.failed },
          { Metric: "Class Average", Value: `${stats.classAvg}%` },
          { Metric: "Highest Score", Value: `${stats.highest}%` },
        ],
      };
    }

    if (name === "Semester Report") {
      return {
        title: "Semester Report",
        rows: [
          { Bucket: "Excellent (>=85)", Students: distribution.excellent },
          { Bucket: "Good (75-84)", Students: distribution.good },
          { Bucket: "Average (60-74)", Students: distribution.average },
          { Bucket: "Below Avg (50-59)", Students: distribution.low },
          { Bucket: "Failed (<50)", Students: distribution.failed },
        ],
      };
    }

    return {
      title: name,
      rows: [{ Metric: "Class Average", Value: `${stats.classAvg}%` }],
    };
  }, [distribution, marks, overviewStudents.length, stats, students, subjects, topTen]);

  const getReportLines = useCallback((reportName = "Report") => {
    const payload = getReportPayload(reportName);
    const rows = payload.rows.length > 0 ? payload.rows : [payload.emptyRow || { Message: "No data available" }];
    const lines = [payload.title, ""];
    rows.forEach((row, index) => {
      if (index > 0) lines.push("");
      Object.entries(row).forEach(([key, value]) => {
        lines.push(`${key}: ${value}`);
      });
    });
    return lines;
  }, [getReportPayload]);

  const exportPdf = (reportName = "Report") => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const safeName = String(reportName || "Report").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
    const reportLines = [`Generated: ${now.toLocaleString()}`, "", ...getReportLines(reportName)];
    const blob = createSimplePdfBlob(reportLines);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName || "report"}-${timestamp}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Report downloaded successfully");
  };

  const exportExcel = (reportName = "Report") => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const safeName = String(reportName || "Report").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
    const payload = getReportPayload(reportName);
    const rows = payload.rows.length > 0 ? payload.rows : [payload.emptyRow || { Message: "No data available" }];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, String(payload.title || "Report").slice(0, 31));
    const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName || "report"}-${timestamp}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Excel downloaded successfully");
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/", { replace: true });
  };

  const handleDeleteStaff = async (id) => {
    try {
      await adminApiRequest(`/api/admin/staff/${id}`, { method: "DELETE" });
      setStaff((prev) => prev.filter((x) => x.id !== id));
      showToast("Staff deleted");
    } catch (error) {
      showToast(error.message || "Failed to delete staff");
    }
  };

  const handleAssignSubject = async () => {
    const staffId = Number(assignmentForm.staff_id);
    const subjectQuery = String(assignmentForm.subject_name || "").trim();
    let matchedSubject = filteredSubjectOptions.find((subject) => matchesSubjectSearch(subject, subjectQuery));

    if (!matchedSubject) {
      const selectedStaff = staff.find((row) => String(row.id) === String(staffId));
      const targetDepartment = String(selectedStaff?.department || "").trim().toUpperCase();
      let latestDbSubject = null;

      try {
        const latestSubjectRows = await adminApiRequest("/api/admin/subjects");
        latestDbSubject = (Array.isArray(latestSubjectRows) ? latestSubjectRows : [])
          .map(normalizeSubjectApiRow)
          .find((subject) => {
            if (targetDepartment && String(subject.department || "").trim().toUpperCase() !== targetDepartment) return false;
            return matchesSubjectSearch(subject, subjectQuery);
          }) || null;

        if (latestDbSubject?.dbId) {
          matchedSubject = toSubjectOption(latestDbSubject);
          setSubjects((prev) => {
            const withoutMatch = prev.filter((subject) => !matchesSubjectSearch(subject, latestDbSubject.code) && !matchesSubjectSearch(subject, latestDbSubject.name));
            return [...withoutMatch, latestDbSubject];
          });
          setSubjectOptions((prev) => {
            const withoutMatch = prev.filter((subject) => !matchesSubjectSearch(subject, latestDbSubject.code) && !matchesSubjectSearch(subject, latestDbSubject.name));
            return [...withoutMatch, toSubjectOption(latestDbSubject)];
          });
        }
      } catch {
        // Fall through to local subject catalog matching.
      }

      const fallbackSubject = subjects.find((subject) => {
        if (targetDepartment && String(subject.department || "").trim().toUpperCase() !== targetDepartment) return false;
        return matchesSubjectSearch(subject, subjectQuery);
      });

      if (!matchedSubject && fallbackSubject) {
        if (Number.isInteger(Number(fallbackSubject.dbId)) && Number(fallbackSubject.dbId) > 0) {
          matchedSubject = toSubjectOption(fallbackSubject);
        } else {
          try {
            const createdSubject = await adminApiRequest("/api/admin/subjects", {
              method: "POST",
              body: JSON.stringify(buildSubjectPayload(fallbackSubject)),
            });
            const normalizedCreatedSubject = {
              ...fallbackSubject,
              dbId: createdSubject.id,
              code: String(createdSubject.subject_code || createdSubject.code || fallbackSubject.code || "").trim().toUpperCase(),
              name: String(createdSubject.subject_name || createdSubject.name || fallbackSubject.name || "").trim(),
              department: String(createdSubject.course || createdSubject.department || fallbackSubject.department || "").trim().toUpperCase(),
              year: String(createdSubject.year || fallbackSubject.year || "").trim(),
              specialization: String(createdSubject.specialization || fallbackSubject.specialization || "").trim(),
              maxMarks: Number(createdSubject.max_marks ?? createdSubject.maxMarks ?? fallbackSubject.maxMarks ?? 0),
              passMarks: Number(createdSubject.pass_marks ?? createdSubject.passMarks ?? fallbackSubject.passMarks ?? 0),
              credits: Number(createdSubject.credits ?? fallbackSubject.credits ?? 0),
            };

            setSubjects((prev) =>
              prev.map((subject) =>
                matchesSubjectSearch(subject, normalizedCreatedSubject.code) ||
                matchesSubjectSearch(subject, normalizedCreatedSubject.name)
                  ? { ...subject, ...normalizedCreatedSubject }
                  : subject
              )
            );
            setSubjectOptions((prev) => {
              const next = [...prev.filter((subject) => !matchesSubjectSearch(subject, normalizedCreatedSubject.code)), toSubjectOption(normalizedCreatedSubject)];
              return next;
            });
            matchedSubject = toSubjectOption(normalizedCreatedSubject);
          } catch (error) {
            try {
              const latestSubjectRows = await adminApiRequest("/api/admin/subjects");
              const duplicateResolvedSubject = (Array.isArray(latestSubjectRows) ? latestSubjectRows : [])
                .map(normalizeSubjectApiRow)
                .find((subject) => {
                  if (targetDepartment && String(subject.department || "").trim().toUpperCase() !== targetDepartment) return false;
                  return matchesSubjectSearch(subject, subjectQuery);
                });

              if (duplicateResolvedSubject?.dbId) {
                matchedSubject = toSubjectOption(duplicateResolvedSubject);
                setSubjects((prev) => {
                  const withoutMatch = prev.filter((subject) => !matchesSubjectSearch(subject, duplicateResolvedSubject.code) && !matchesSubjectSearch(subject, duplicateResolvedSubject.name));
                  return [...withoutMatch, duplicateResolvedSubject];
                });
                setSubjectOptions((prev) => {
                  const withoutMatch = prev.filter((subject) => !matchesSubjectSearch(subject, duplicateResolvedSubject.code) && !matchesSubjectSearch(subject, duplicateResolvedSubject.name));
                  return [...withoutMatch, toSubjectOption(duplicateResolvedSubject)];
                });
              } else {
                showToast(error.message || "Failed to prepare subject for assignment");
                return;
              }
            } catch {
              showToast(error.message || "Failed to prepare subject for assignment");
              return;
            }
          }
        }
      }
    }

    const subjectId = Number(matchedSubject?.id);
    if (!Number.isInteger(staffId) || staffId <= 0 || !subjectQuery || !Number.isInteger(subjectId) || subjectId <= 0) {
      showToast("Enter a valid subject name");
      return;
    }

    try {
      await adminApiRequest("/api/admin/staff-subjects", {
        method: "POST",
        body: JSON.stringify({
          staff_id: staffId,
          subject_id: subjectId,
          semester: assignmentForm.semester ? Number(assignmentForm.semester) : null,
          academic_year: assignmentForm.academic_year || null,
        }),
      });

      const assignmentRows = await adminApiRequest("/api/admin/staff-subjects");
      const subjectsByStaffId = buildUniqueSubjectsByStaffId(assignmentRows);

      setStaff((prev) =>
        prev.map((row) => ({
          ...row,
          subjects: Array.from(subjectsByStaffId[String(row.id)] || []),
        }))
      );

      setAssignmentForm({ staff_id: "", subject_name: "", semester: "", academic_year: "" });
      showToast("Staff subject assigned");
    } catch (error) {
      showToast(error.message || "Failed to assign subject");
    }
  };

  const handleAssignStudentsToStaff = async () => {
    const staffId = Number(studentAssignmentForm.staff_id);
    const studentIds = (Array.isArray(studentAssignmentForm.student_ids) ? studentAssignmentForm.student_ids : [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (!Number.isInteger(staffId) || studentIds.length === 0) {
      showToast("Choose staff and at least one student");
      return;
    }

    try {
      await adminApiRequest("/api/admin/students/bulk-assign", {
        method: "POST",
        body: JSON.stringify({
          student_ids: studentIds,
          staff_id: staffId,
        }),
      });

      const refreshedStudentRows = await adminApiRequest("/api/admin/students");
      const assignedStudentsByStaffId = (Array.isArray(refreshedStudentRows) ? refreshedStudentRows : []).reduce((acc, row) => {
        const key = String(row.staff_id ?? "");
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(row);
        return acc;
      }, {});

      setStaff((prev) =>
        prev.map((row) => {
          const assignedStudents = assignedStudentsByStaffId[String(row.id)] || [];
          const assignedStudentYears = getAssignedYearLabels(assignedStudents);
          const assignedStudentDetails = buildAssignedStudentDetails(assignedStudents);
          return {
            ...row,
            assignedStudentsCount: assignedStudents.length,
            assignedStudentYears,
            assignedStudents: assignedStudentDetails,
            status: assignedStudents.length > 0 ? `${assignedStudents.length} students assigned` : "active",
          };
        })
      );

      setStudentAssignmentForm((prev) => ({ ...prev, student_ids: [], query: "" }));
      showToast("Students assigned to staff");
    } catch (error) {
      showToast(error.message || "Failed to assign students");
    }
  };

  const handleViewAssignedStudents = useCallback((staffMember) => {
    const assignedStudents = Array.isArray(staffMember?.assignedStudents) ? staffMember.assignedStudents : [];
    if (assignedStudents.length === 0) {
      showToast("No students assigned");
      return;
    }

    const lines = assignedStudents.map((student, index) => {
      const rollLabel = student.roll ? ` (${student.roll})` : "";
      return `${index + 1}. ${student.name}${rollLabel} - ${student.year}`;
    });
    window.alert(`Assigned students for ${staffMember.name}\n\n${lines.join("\n")}`);
  }, [showToast]);

  const footerStats = (
    <section className="ad-footer-strip">
      <div><strong className="score-violet">{staff.length}</strong><span>Active Staff</span></div>
      <div><strong className="score-purple">{subjects.length}</strong><span>Total Subjects</span></div>
      <div><strong className="score-blue">{overviewStudents.length}</strong><span>Active Students</span></div>
      <div><strong className="score-green">{overviewStudents.filter((s) => s.api >= threshold).length}</strong><span>Passed Students</span></div>
    </section>
  );
  const mbbsAvgApi = stats.mbbs
    ? Number((overviewStudents.filter((s) => s.department === "MBBS").reduce((sum, s) => sum + s.api, 0) / stats.mbbs).toFixed(2))
    : 0;
  const handleStudentSort = (key) => {
    setStudentSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };
  const getStudentSortSymbol = (key) => {
    if (studentSort.key !== key) return "↕";
    return studentSort.direction === "asc" ? "▲" : "▼";
  };
  return (
    <div className="admin-shell">
      <header className="ad-header">
        <div className="ad-header-left">
          <div className="ad-logo"><FiShield /></div>
          <div>
            <h1>Admin Dashboard - Academic Performance Normalizer</h1>
            <p><FiUser /> Admin Portal • Full System Access</p>
          </div>
        </div>
        <div className="ad-header-actions">
          <button type="button" className="ad-export" onClick={() => exportPdf("Class Summary")}><FiDownload /> Export Data</button>
          <button type="button" className="ad-export" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="ad-container">
        {(activeTab === "overview" || activeTab === "students") && (
          <section className="ad-filter-card">
            <div className="ad-filter-controls">
              <div>
                <label>Select Department:</label>
                <div className="ad-select">
                  <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                    <option value="all">All Departments</option>
                    <option value="MBBS">MBBS Only</option>
                  </select>
                  <FiChevronDown />
                </div>
              </div>
              <div>
                <label>Select Year:</label>
                <div className="ad-select">
                  <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                    <option value="all">All Years</option>
                    <option value="year 1">Year 1</option>
                    <option value="year 2">Year 2</option>
                    <option value="year 3">Year 3</option>
                    <option value="year 4">Year 4</option>
                  </select>
                  <FiChevronDown />
                </div>
              </div>
              <div>
                <label>Select Exam:</label>
                <div className="ad-select">
                  <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)}>
                    <option value="all">All Exams</option>
                    {examOptions.map((exam) => (
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>
                  <FiChevronDown />
                </div>
              </div>
            </div>
            <div className="ad-top-counts">
              <div><strong className="score-blue">{stats.totalStudents}</strong><span>Total Students</span></div>
              <div><strong className="score-indigo">{stats.mbbs}</strong><span>MBBS</span></div>
            </div>
          </section>
        )}

        <nav className="ad-tabbar">
          {TABS.map((tab) => (
            <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <>
            <section className="ad-grid-8">
              <article className="ad-card"><h3>Total Students</h3><strong className="score-blue">{stats.totalStudents}</strong><p>{stats.mbbs} MBBS</p><span className="icon blue"><FiUsers /></span></article>
              <article className="ad-card"><h3>Total Staff</h3><strong className="score-violet">{stats.staff}</strong><p>Active faculty members</p><span className="icon violet"><FiUserCheck /></span></article>
              <article className="ad-card"><h3>Total Subjects</h3><strong className="score-indigo">{stats.subjects}</strong><p>Only in MBBS department</p><span className="icon indigo"><FiBook /></span></article>
              <article className="ad-card"><h3>Class Average</h3><strong className="score-green">{stats.classAvg}%</strong><p>Normalized API score</p><span className="icon green"><FiTrendingUp /></span></article>
              <article className="ad-card"><h3>Highest Score</h3><strong className="score-orange">{stats.highest}%</strong><p>Top performer</p><span className="icon orange"><FiAward /></span></article>
              <article className="ad-card"><h3>Pass Percentage</h3><strong className="score-green">{stats.passPercentage}%</strong><p>{overviewStudents.length - stats.failed} students passed</p><span className="icon green"><FiCheckCircle /></span></article>
              <article className="ad-card"><h3>Failed Students</h3><strong className="score-red">{stats.failed}</strong><p>Below {threshold}% API</p><span className="icon red"><FiXCircle /></span></article>
              <article className="ad-card"><h3>Departments</h3><strong className="score-sky">{stats.departments}</strong><p>MBBS</p><span className="icon sky"><FiBarChart2 /></span></article>
            </section>

            <section className="ad-grid-2">
              <article className="ad-panel">
                <div className="panel-head"><h3>MBBS Department</h3><span className="pill dark">{stats.mbbs} Students</span></div>
                <div className="rows">
                  <p>Students <strong>{stats.mbbs}</strong></p>
                  <p>Staff <strong>{staff.filter((s) => s.department === "MBBS").length}</strong></p>
                  <p>Subjects <strong>{subjects.filter((s) => s.department === "MBBS").length}</strong></p>
                  <p>Avg API <strong className="score-blue">{mbbsAvgApi}%</strong></p>
                </div>
              </article>
            </section>

            <section className="ad-panel">
              <h3>Performance Distribution</h3>
              <div className="dist-grid">
                <div><strong className="score-green">{distribution.excellent}</strong><span>Excellent (&gt;=85%)</span></div>
                <div><strong className="score-blue">{distribution.good}</strong><span>Good (75-84%)</span></div>
                <div><strong className="score-yellow">{distribution.average}</strong><span>Average (60-74%)</span></div>
                <div><strong className="score-orange">{distribution.low}</strong><span>Below Avg (50-59%)</span></div>
                <div><strong className="score-red">{distribution.failed}</strong><span>Failed (&lt;50%)</span></div>
              </div>
            </section>
            {footerStats}
          </>
        )}

        {activeTab === "students" && (
          <section className="ad-panel">
            <div className="head-row">
              <div><h2>Student Management</h2><p>Manage student records, assignments, and details</p></div>
              <button type="button" className="dark-btn" onClick={handleStudentSave}><FiPlus /> {editingStudent ? "Update Student" : "Add Student"}</button>
            </div>
            <div className="ad-form-grid six">
              <input placeholder="Roll No" value={studentForm.roll} onChange={(e) => setStudentForm((p) => ({ ...p, roll: e.target.value }))} />
              <input placeholder="Name" value={studentForm.name} onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))} />
              <select value={studentForm.department} onChange={(e) => setStudentForm((p) => ({ ...p, department: e.target.value }))}><option>MBBS</option></select>
              <input placeholder="Year" value={studentForm.year} onChange={(e) => setStudentForm((p) => ({ ...p, year: e.target.value }))} />
              <input placeholder="Batch" value={studentForm.batch} onChange={(e) => setStudentForm((p) => ({ ...p, batch: e.target.value }))} />
              <input placeholder="API" value={studentForm.api} onChange={(e) => setStudentForm((p) => ({ ...p, api: e.target.value }))} />
            </div>
            <label className="search"><FiSearch /><input placeholder="Search by name or roll number..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} /></label>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("roll")}>Roll No <span>{getStudentSortSymbol("roll")}</span></button></th>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("name")}>Name <span>{getStudentSortSymbol("name")}</span></button></th>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("department")}>Department <span>{getStudentSortSymbol("department")}</span></button></th>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("year")}>Year <span>{getStudentSortSymbol("year")}</span></button></th>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("batch")}>Batch <span>{getStudentSortSymbol("batch")}</span></button></th>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("api")}>Normalized Score <span>{getStudentSortSymbol("api")}</span></button></th>
                    <th><button type="button" className="sort-btn" onClick={() => handleStudentSort("rank")}>Rank <span>{getStudentSortSymbol("rank")}</span></button></th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.roll}>
                      <td>{s.roll}</td>
                      <td>{s.name}</td>
                      <td><span className={deptBadge(s.department)}>{s.department}</span></td>
                      <td>{s.year}</td>
                      <td>{s.batch}</td>
                      <td>{s.hasApi ? s.api.toFixed(2) : ""}</td>
                      <td>{s.hasRank ? <span className="rank-chip">#{s.rank}</span> : ""}</td>
                      <td><span className="status">{s.status}</span></td>
                      <td><div className="actions"><button type="button" onClick={() => showToast(s.name)}><FiEye /></button><button type="button" onClick={() => { setEditingStudent(s.id ?? s.roll); setStudentForm({ roll: s.roll, name: s.name, department: s.department, year: s.year, batch: s.batch, api: s.hasApi ? String(s.api) : "" }); }}><FiEdit2 /></button><button type="button" onClick={() => deleteWithConfirm("Delete this student?", () => { setStudents((prev) => recalcRanks(prev.filter((x) => x.roll !== s.roll))); showToast("Student deleted"); })}><FiTrash2 /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {footerStats}
          </section>
        )}

        {activeTab === "staff" && (
          <section className="ad-panel">
            <div className="head-row">
              <div><h2>Staff Management</h2><p>Manage staff records and subject assignments</p></div>
              <button type="button" className="dark-btn" onClick={handleStaffSave}><FiPlus /> {editingStaff ? "Update Staff" : "Add Staff"}</button>
            </div>
            <div className="ad-form-grid four">
              <input placeholder="Staff ID" value={staffForm.id} onChange={(e) => setStaffForm((p) => ({ ...p, id: e.target.value }))} />
              <input placeholder="Name" value={staffForm.name} onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))} />
              <select value={staffForm.department} onChange={(e) => setStaffForm((p) => ({ ...p, department: e.target.value }))}><option>MBBS</option></select>
              <input placeholder="Designation" value={staffForm.designation} onChange={(e) => setStaffForm((p) => ({ ...p, designation: e.target.value }))} />
            </div>
            <div className="subject-multi-select">
              {(staffForm.department === "MBBS" ? mbbsSubjects : mdSubjects).map((s) => (
                <label key={s.code}><input type="checkbox" checked={(staffForm.subjects || []).includes(s.name)} onChange={() => toggleStaffSubject(s.name)} /> {s.name}</label>
              ))}
            </div>
            <div className="marks-add">
              <h2>Staff Subject Assignment</h2>
              <p>Enter subject name or code and assign it to staff</p>
              <div className="ad-form-grid four">
                <select
                  value={assignmentForm.staff_id}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, staff_id: e.target.value }))}
                >
                  <option value="">Choose staff</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.id} - {st.name}
                    </option>
                  ))}
                </select>
                <input
                  list="staff-subject-options"
                  placeholder="Enter subject name or code"
                  value={assignmentForm.subject_name}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, subject_name: e.target.value }))}
                />
                <datalist id="staff-subject-options">
                  {filteredSubjectOptions.map((sub) => (
                    <option key={`${sub.code || sub.name}-${sub.id}`} value={sub.name}>
                      {sub.code}
                    </option>
                  ))}
                  {filteredSubjectOptions.map((sub) => (
                    <option key={`${sub.code || sub.id}-code`} value={sub.code}>
                      {sub.name}
                    </option>
                  ))}
                </datalist>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Semester (optional)"
                  value={assignmentForm.semester}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, semester: e.target.value }))}
                />
                <input
                  placeholder="Academic year (optional)"
                  value={assignmentForm.academic_year}
                  onChange={(e) => setAssignmentForm((prev) => ({ ...prev, academic_year: e.target.value }))}
                />
              </div>
              <button type="button" className="dark-btn" onClick={handleAssignSubject}>
                <FiPlus /> Assign Subject
              </button>
            </div>
            <div className="marks-add">
              <h2>Staff Student Assignment</h2>
              <p>Assign students directly to staff and store in DB</p>
              <div className="ad-form-grid four">
                <select
                  value={studentAssignmentForm.staff_id}
                  onChange={(e) => setStudentAssignmentForm((prev) => ({ ...prev, staff_id: e.target.value }))}
                >
                  <option value="">Choose staff</option>
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.id} - {st.name}
                    </option>
                  ))}
                </select>
                <select
                  value={studentAssignmentForm.department}
                  onChange={(e) => setStudentAssignmentForm((prev) => ({ ...prev, department: e.target.value, student_ids: [] }))}
                >
                  <option value="MBBS">MBBS</option>
                </select>
                <select
                  value={studentAssignmentForm.year}
                  onChange={(e) => setStudentAssignmentForm((prev) => ({ ...prev, year: e.target.value, student_ids: [] }))}
                >
                  <option value="">All Years</option>
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4 / Final</option>
                </select>
                <input
                  placeholder="Search roll or name"
                  value={studentAssignmentForm.query}
                  onChange={(e) => setStudentAssignmentForm((prev) => ({ ...prev, query: e.target.value }))}
                />
              </div>
              <div className="subject-multi-select">
                {assignStudentOptions.map((student) => {
                  const studentId = Number(student.id);
                  const checked = (studentAssignmentForm.student_ids || []).includes(studentId);
                  return (
                    <label key={studentId}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setStudentAssignmentForm((prev) => {
                            const currentIds = Array.isArray(prev.student_ids) ? prev.student_ids : [];
                            return {
                              ...prev,
                              student_ids: checked ? currentIds.filter((id) => id !== studentId) : [...currentIds, studentId],
                            };
                          })
                        }
                      />
                      {student.roll} - {student.name} ({student.year})
                    </label>
                  );
                })}
                {assignStudentOptions.length === 0 ? <p>No students found for selected filter.</p> : null}
              </div>
              <button type="button" className="dark-btn" onClick={handleAssignStudentsToStaff}>
                <FiPlus /> Assign Selected Students
              </button>
            </div>
            <label className="search"><FiSearch /><input placeholder="Search by name or staff ID..." value={searchStaff} onChange={(e) => setSearchStaff(e.target.value)} /></label>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Staff ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Subjects</th><th>Assigned Students</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredStaff.map((f) => (
                    <tr key={f.id}>
                      <td>{f.id}</td>
                      <td>{f.name}</td>
                      <td><span className={deptBadge(f.department)}>{f.department}</span></td>
                      <td>{f.designation || "-"}</td>
                      <td><span className="count-chip">{(f.subjects || []).length} subjects</span></td>
                      <td>
                        <span className="count-chip">{f.assignedStudentsCount || 0} students</span>
                        {Array.isArray(f.assignedStudentYears) && f.assignedStudentYears.length > 0 ? ` • ${f.assignedStudentYears.join(", ")}` : ""}
                      </td>
                      <td><span className="status">{f.status}</span></td>
                      <td><div className="actions"><button type="button" onClick={() => handleViewAssignedStudents(f)}><FiEye /></button><button type="button" onClick={() => { setEditingStaff(f.id); setStaffForm({ id: String(f.id), name: f.name || "", email: f.email || "", password: "", department: f.department || "MBBS", designation: f.designation || "Professor", subjects: [...(f.subjects || [])] }); }}><FiEdit2 /></button><button type="button" onClick={() => deleteWithConfirm("Delete this staff member?", () => handleDeleteStaff(f.id))}><FiTrash2 /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {footerStats}
          </section>
        )}
        {activeTab === "subjects" && (
          <section className="ad-panel">
            <div className="head-row">
              <div><h2>Subject Management</h2><p>Manage subjects, marks allocation, and credits</p></div>
              <button type="button" className="dark-btn" onClick={handleSubjectSave}><FiPlus /> {editingSubject ? "Update Subject" : "Add Subject"}</button>
            </div>
            <div className="ad-form-grid six">
              <input placeholder="Code" value={subjectForm.code} onChange={(e) => setSubjectForm((p) => ({ ...p, code: e.target.value }))} />
              <input placeholder="Name" value={subjectForm.name} onChange={(e) => setSubjectForm((p) => ({ ...p, name: e.target.value }))} />
              <select value={subjectForm.department} onChange={(e) => setSubjectForm((p) => ({ ...p, department: e.target.value }))}><option>MBBS</option></select>
              <select value={subjectForm.year} onChange={(e) => setSubjectForm((p) => ({ ...p, year: e.target.value }))}>
                <option value="1st">1st</option>
                <option value="2nd">2nd</option>
                <option value="3rd">3rd</option>
                <option value="Final">Final</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
              </select>
              <input
                type="number"
                placeholder="Max Marks"
                value={subjectForm.maxMarks}
                onChange={(e) => setSubjectForm((p) => ({ ...p, maxMarks: e.target.value }))}
              />
              <input type="number" placeholder="Pass Marks" value={subjectForm.passMarks} onChange={(e) => setSubjectForm((p) => ({ ...p, passMarks: e.target.value }))} />
              <input type="number" placeholder="Credits" value={subjectForm.credits} onChange={(e) => setSubjectForm((p) => ({ ...p, credits: e.target.value }))} />
            </div>
            <label className="search"><FiSearch /><input placeholder="Search by name or code..." value={searchSubject} onChange={(e) => setSearchSubject(e.target.value)} /></label>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Course</th><th>Year</th><th>Max Marks</th><th>Passing Marks</th><th>Credits</th><th>Actions</th></tr></thead>
                <tbody>
                  {baseSubjects.map((s) => (
                    <tr key={s.dbId || s.code}>
                      <td>{s.code}</td>
                      <td>{s.name}</td>
                      <td><span className={deptBadge(s.department)}>{s.department}</span></td>
                      <td>{s.year || "-"}</td>
                      <td>{s.maxMarks}</td>
                      <td>{s.passMarks}</td>
                      <td>{s.credits}</td>
                      <td><div className="actions"><button type="button" onClick={() => { setEditingSubject(s.dbId); setSubjectForm({ code: s.code, name: s.name, department: s.department, year: s.year || "1st", specialization: s.specialization || "", maxMarks: s.maxMarks, passMarks: s.passMarks, credits: s.credits }); }}><FiEdit2 /></button><button type="button" onClick={() => deleteWithConfirm("Delete this subject?", () => handleDeleteSubject(s.dbId))}><FiTrash2 /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {activeTab === "marks" && (
          <section className="ad-panel">
            <div className="subtabs">
              {MARKS_TABS.map((tab) => (
                <button key={tab} type="button" className={marksTab === tab ? "active" : ""} onClick={() => setMarksTab(tab)}>{tab === "add" ? "Add Marks" : tab === "view" ? "View Marks" : "Upload Excel"}</button>
              ))}
            </div>

            {marksTab === "add" && (
              <div className="marks-add">
                <h2>Add Student Marks</h2>
                <p>Enter marks for individual students</p>
                <div className="ad-form-grid four">
                  <select value={marksForm.studentRoll} onChange={(e) => setMarksForm((p) => ({ ...p, studentRoll: e.target.value }))}>
                    <option value="">Choose student</option>
                    {students.map((s) => <option key={s.roll} value={s.roll}>{s.roll} - {s.name}</option>)}
                  </select>
                  <select value={marksForm.subjectCode} onChange={(e) => setMarksForm((p) => ({ ...p, subjectCode: e.target.value }))}>
                    <option value="">Choose subject</option>
                    {subjects.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
                  </select>
                  <select value={marksForm.examName} onChange={(e) => setMarksForm((p) => ({ ...p, examName: e.target.value }))}>
                    {MBBS_EXAM_STRUCTURE.map((exam) => <option key={exam.name} value={exam.name}>{exam.name} ({exam.maxMarks})</option>)}
                  </select>
                  <input placeholder="Enter marks" value={marksForm.rawMarks} onChange={(e) => setMarksForm((p) => ({ ...p, rawMarks: e.target.value }))} />
                  <button type="button" className="dark-btn" onClick={handleMarksSave}><FiSave /> {editingMarkId ? "Update Marks" : "Add Marks"}</button>
                </div>
              </div>
            )}

            {marksTab === "view" && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Subject</th><th>Exam</th><th>Raw Marks</th><th>Normalized</th><th>Actions</th></tr></thead>
                  <tbody>
                    {marks.map((m) => (
                      <tr key={m.id}>
                        <td>{m.studentRoll}</td>
                        <td>{m.subjectCode}</td>
                        <td>{m.examName || "-"}</td>
                        <td>{m.rawMarks}</td>
                        <td>{m.normalized}</td>
                        <td><div className="actions"><button type="button" onClick={() => { setEditingMarkId(m.id); setMarksForm({ studentRoll: m.studentRoll, subjectCode: m.subjectCode, examName: m.examName || DEFAULT_MBBS_EXAM_NAME, rawMarks: String(m.rawMarks) }); setMarksTab("add"); }}><FiEdit2 /></button><button type="button" onClick={() => deleteWithConfirm("Delete this marks entry?", () => handleDeleteMark(m.id))}><FiTrash2 /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {marksTab === "upload" && (
              <div className="upload-box">
                <FiUpload className="upload-box-icon" />
                <p className="upload-box-title">Upload marks using Excel sheet</p>
                <input
                  id="admin-marks-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleMarksUpload}
                  disabled={isUploadingMarks}
                  hidden
                />
                <div className="upload-box-actions">
                  <label className="dark-btn" htmlFor="admin-marks-upload">
                    <FiUpload /> {isUploadingMarks ? "Uploading..." : "Choose Excel File"}
                  </label>
                  <button type="button" className="dark-btn" onClick={downloadTemplate}>Download Template</button>
                </div>
                {uploadFileName ? <small className="upload-box-file">{uploadFileName}</small> : null}
              </div>
            )}
            {footerStats}
          </section>
        )}

        {activeTab === "settings" && (
          <section className="ad-panel">
            <h2><FiSettings /> Normalization Settings</h2>
            <p>Configure how scores are normalized across different exams</p>

            <label className="control-label">Normalization Method</label>
            <div className="ad-select wide">
              <select
                value={method}
                onChange={(e) => {
                  const next = methods.find((m) => m.id === e.target.value);
                  setMethod(e.target.value);
                  setMethodDesc(next ? next.desc : "");
                }}
              >
                <option value="minmax">Min-Max Normalization</option>
                <option value="zscore">Z-Score Normalization</option>
                <option value="percentile">Percentile Normalization</option>
              </select>
              <FiChevronDown />
            </div>

            <div className="method-note">
              <h4>About method:</h4>
              <p>{methodDesc}</p>
            </div>

            <label className="control-label">Pass Mark Threshold (%)</label>
            <input className="wide-input" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />

            <label className="control-label">Description</label>
            <textarea className="wide-input" rows={3} value={methodDesc} onChange={(e) => setMethodDesc(e.target.value)} />

            <button type="button" className="dark-btn full" onClick={() => showToast("Settings saved")}><FiSave /> Save Settings</button>

            <section className="methods-list">
              <h3>Available Normalization Methods</h3>
              {methods.map((m) => (
                <article key={m.id} className={`method-card ${method === m.id ? "active" : ""}`}>
                  <div>
                    <h4>{m.name} {method === m.id ? <span className="status">Currently Active</span> : null}</h4>
                    <p>{m.desc}</p>
                    <small>Pass Threshold: {threshold}%</small>
                  </div>
                  <button type="button" onClick={() => { setMethod(m.id); setMethodDesc(m.desc); }}>Select</button>
                </article>
              ))}
            </section>

            <section className="formula-box">
              <h3>Formula Preview</h3>
              <pre>{`Min-Max Formula:\nNormalized Score = ((Raw Score - Min) / (Max - Min)) * 100`}</pre>
            </section>
          </section>
        )}

        {activeTab === "reports" && (
          <section className="ad-panel">
            <div className="report-cards">
              <article><span className="icon blue"><FiAward /></span><h4>Merit List</h4><p>Top performers</p><div><button type="button" onClick={() => exportPdf("Merit List")}><FiDownload /> PDF</button><button type="button" onClick={() => exportExcel("Merit List")}><FiDownload /> Excel</button></div></article>
              <article><span className="icon violet"><FiBarChart2 /></span><h4>Subject Report</h4><p>Performance analysis</p><div><button type="button" onClick={() => exportPdf("Subject Report")}><FiDownload /> PDF</button><button type="button" onClick={() => exportExcel("Subject Report")}><FiDownload /> Excel</button></div></article>
              <article><span className="icon green"><FiUsers /></span><h4>Class Summary</h4><p>Overall statistics</p><div><button type="button" onClick={() => exportPdf("Class Summary")}><FiDownload /> PDF</button><button type="button" onClick={() => exportExcel("Class Summary")}><FiDownload /> Excel</button></div></article>
              <article><span className="icon orange"><FiFileText /></span><h4>Semester Report</h4><p>Complete results</p><div><button type="button" onClick={() => exportPdf("Semester Report")}><FiDownload /> PDF</button><button type="button" onClick={() => exportExcel("Semester Report")}><FiDownload /> Excel</button></div></article>
            </div>

            <section className="ad-panel merit">
              <div className="head-row">
                <div><h2>Merit List - Top 10 Students</h2><p>Ranked by normalized API score</p></div>
                <div className="merit-actions">
                  <div className="ad-select">
                    <select value={reportYearFilter} onChange={(e) => setReportYearFilter(e.target.value)}>
                      <option value="all">All Years</option>
                      <option value="year 1">Year 1</option>
                      <option value="year 2">Year 2</option>
                      <option value="year 3">Year 3</option>
                      <option value="year 4">Year 4</option>
                    </select>
                    <FiChevronDown />
                  </div>
                  <button type="button" className="dark-btn" onClick={() => exportPdf("Merit List Full")}><FiDownload /> Download Full List</button>
                </div>
              </div>
              <div className="rank-list">
                {topTen.map((s, index) => {
                  const displayRank = index + 1;
                  return (
                    <article key={s.roll} className={`rank-row ${displayRank <= 3 ? "top" : ""}`}>
                      <div className="rank-left">
                        <span className={`rank-pill ${rankBadgeClass(displayRank)}`}>Rank {displayRank}</span>
                        <div className="rank-meta">
                          <h4>{s.name}</h4>
                          <p>{s.roll} <span className={deptBadge(s.department)}>{s.department}</span></p>
                        </div>
                      </div>
                      <div className="rank-right">
                        <strong>{s.api.toFixed(2)}</strong>
                        <span>API Score</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
            
            <section className="ad-panel">
              <h3>Normalized Score Distribution</h3>
              <p>Visual breakdown of student performance</p>
              <div className="legend-list">
                <div><span className="dot green" /> Excellent (&gt;=85%) <strong>{distribution.excellent} students</strong></div>
                <div><span className="dot blue" /> Good (75-84%) <strong>{distribution.good} students</strong></div>
                <div><span className="dot yellow" /> Average (60-74%) <strong>{distribution.average} students</strong></div>
                <div><span className="dot orange" /> Below Average (50-59%) <strong>{distribution.low} students</strong></div>
                <div><span className="dot red" /> Failed (&lt;50%) <strong>{distribution.failed} students</strong></div>
              </div>
            </section>
          </section>
        )}
      </main>

      {toast ? <div className="ad-toast">{toast}</div> : null}
    </div>
  );
}

export default AdminDashboard;

