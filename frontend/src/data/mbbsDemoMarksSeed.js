export const MBBS_EXAM_STRUCTURE = [
  { name: "Internal 1", maxMarks: 50 },
  { name: "Internal 2", maxMarks: 50 },
  { name: "Midterm", maxMarks: 75 },
  { name: "Final Exam", maxMarks: 100 },
];

export const MBBS_SUBJECT_TOTALS = {
  MBBS101: { name: "Anatomy", year: "1st", maxMarks: 275, passMarks: 138 },
  MBBS102: { name: "Physiology", year: "1st", maxMarks: 275, passMarks: 138 },
  MBBS103: { name: "Biochemistry", year: "1st", maxMarks: 275, passMarks: 138 },
  MBBS201: { name: "Pathology", year: "2nd", maxMarks: 275, passMarks: 138 },
  MBBS202: { name: "Microbiology", year: "2nd", maxMarks: 275, passMarks: 138 },
  MBBS203: { name: "Forensic Medicine", year: "2nd", maxMarks: 275, passMarks: 138 },
  MBBS301: { name: "Community Medicine", year: "3rd", maxMarks: 275, passMarks: 138 },
  MBBS302: { name: "Ophthalmology", year: "3rd", maxMarks: 275, passMarks: 138 },
  MBBS303: { name: "ENT", year: "3rd", maxMarks: 275, passMarks: 138 },
  MBBS401: { name: "General Medicine", year: "Final", maxMarks: 275, passMarks: 138 },
  MBBS402: { name: "General Surgery", year: "Final", maxMarks: 275, passMarks: 138 },
  MBBS403: { name: "OBG", year: "Final", maxMarks: 275, passMarks: 138 },
};

const SUBJECT_DIFFICULTY = {
  MBBS101: -2,
  MBBS102: -4,
  MBBS103: -1,
  MBBS201: -3,
  MBBS202: -1,
  MBBS203: 3,
  MBBS301: 2,
  MBBS302: 4,
  MBBS303: 3,
  MBBS401: -4,
  MBBS402: -5,
  MBBS403: -1,
};

const EXAM_OFFSETS = {
  "Internal 1": -3,
  "Internal 2": -1,
  Midterm: -2,
  "Final Exam": 2,
};

const YEAR_PROGRESS_BOOST = {
  "1st": -2,
  "2nd": 0,
  "3rd": 2,
  Final: 4,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeKey = (value) => String(value || "").trim().toUpperCase();

const suffixNumber = (studentRoll) => {
  const match = normalizeKey(studentRoll).match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const seedRatio = (studentRoll, subjectCode, salt = 0) => {
  const input = `${normalizeKey(studentRoll)}_${normalizeKey(subjectCode)}_${salt}`;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) % 1000003;
  }
  return (hash % 1000) / 1000;
};

const performanceBandForStudent = (studentRoll) => {
  const rollNo = suffixNumber(studentRoll);
  const bucket = ((rollNo - 1) % 10 + 10) % 10;
  if (bucket <= 1) return "high";
  if (bucket >= 8) return "low";
  return "average";
};

const basePercentageForStudent = (studentRoll, subjectCode) => {
  const band = performanceBandForStudent(studentRoll);
  const subjectKey = normalizeKey(subjectCode);
  const meta = MBBS_SUBJECT_TOTALS[subjectKey] || {};
  const difficulty = SUBJECT_DIFFICULTY[subjectKey] || 0;
  const yearBoost = YEAR_PROGRESS_BOOST[String(meta.year || "")] || 0;
  const fineTune = (seedRatio(studentRoll, subjectCode, 1) - 0.5) * 8;

  const baseByBand = {
    high: 86 + fineTune,
    average: 62 + fineTune,
    low: 38 + fineTune,
  };

  const bandBase = baseByBand[band] ?? 62;
  const minByBand = { high: 81, average: 50, low: 18 };
  const maxByBand = { high: 96, average: 75, low: 49 };

  return clamp(bandBase + difficulty + yearBoost, minByBand[band], maxByBand[band]);
};

const examPercentageForStudent = (studentRoll, subjectCode, examName) => {
  const band = performanceBandForStudent(studentRoll);
  const base = basePercentageForStudent(studentRoll, subjectCode);
  const examOffset = EXAM_OFFSETS[examName] || 0;
  const jitter = (seedRatio(studentRoll, subjectCode, examName) - 0.5) * 6;
  const bandMin = { high: 81, average: 50, low: 15 };
  const bandMax = { high: 98, average: 76, low: 49 };
  const failurePenalty = band === "low" && seedRatio(studentRoll, subjectCode, `${examName}-fail`) > 0.6 ? -8 : 0;
  return clamp(base + examOffset + jitter + failurePenalty, bandMin[band], bandMax[band]);
};

export const buildMbbsDemoExamRows = ({ studentRoll, subjectCode, startId = 1 }) =>
  MBBS_EXAM_STRUCTURE.map((exam, index) => {
    const percentage = examPercentageForStudent(studentRoll, subjectCode, exam.name);
    const rawMarks = Math.round((percentage / 100) * exam.maxMarks);
    const clampedMarks = clamp(rawMarks, 0, exam.maxMarks);
    return {
      id: startId + index,
      studentRoll: normalizeKey(studentRoll),
      subjectCode: normalizeKey(subjectCode),
      examName: exam.name,
      rawMarks: clampedMarks,
      normalized: Number(((clampedMarks / exam.maxMarks) * 100).toFixed(2)),
    };
  });

export const computeSubjectPercentageFromExamRows = (examRows, examMetaById = {}) => {
  const rows = Array.isArray(examRows) ? examRows : [];
  const latestRowByExamKey = new Map();

  rows.forEach((row) => {
    const examName = String(row?.exam_name || row?.examName || "").trim();
    const examId = Number(row?.exam_id);
    const examKey = examName || (Number.isFinite(examId) ? `id:${examId}` : "");
    if (!examKey) return;

    const currentId = Number(row?.id);
    const existing = latestRowByExamKey.get(examKey);
    const existingId = Number(existing?.id);
    if (!existing || (Number.isFinite(currentId) && (!Number.isFinite(existingId) || currentId >= existingId))) {
      latestRowByExamKey.set(examKey, row);
    }
  });

  let totalMarks = 0;
  let totalMax = 0;

  Array.from(latestRowByExamKey.values()).forEach((row) => {
    const rawMarks = Number(row?.marks_obtained ?? row?.rawMarks);
    const examId = Number(row?.exam_id);
    const inlineMax = Number(row?.max_marks);
    const lookupMax = Number(examMetaById?.[examId]?.max_marks);
    const examMax = Number.isFinite(inlineMax) && inlineMax > 0 ? inlineMax : lookupMax;
    if (!Number.isFinite(rawMarks) || !Number.isFinite(examMax) || examMax <= 0) return;
    totalMarks += rawMarks;
    totalMax += examMax;
  });

  if (totalMax <= 0) return NaN;
  return Number((clamp((totalMarks / totalMax) * 100, 0, 100)).toFixed(1));
};

export const computeSubjectTotalsFromExamRows = (examRows, examMetaById = {}) => {
  const rows = Array.isArray(examRows) ? examRows : [];
  const latestRowByExamKey = new Map();

  rows.forEach((row) => {
    const examName = String(row?.exam_name || row?.examName || "").trim();
    const examId = Number(row?.exam_id);
    const examKey = examName || (Number.isFinite(examId) ? `id:${examId}` : "");
    if (!examKey) return;

    const currentId = Number(row?.id);
    const existing = latestRowByExamKey.get(examKey);
    const existingId = Number(existing?.id);
    if (!existing || (Number.isFinite(currentId) && (!Number.isFinite(existingId) || currentId >= existingId))) {
      latestRowByExamKey.set(examKey, row);
    }
  });

  let obtained = 0;
  let max = 0;

  Array.from(latestRowByExamKey.values()).forEach((row) => {
    const rawMarks = Number(row?.marks_obtained ?? row?.rawMarks);
    const examId = Number(row?.exam_id);
    const inlineMax = Number(row?.max_marks);
    const lookupMax = Number(examMetaById?.[examId]?.max_marks);
    const examMax = Number.isFinite(inlineMax) && inlineMax > 0 ? inlineMax : lookupMax;
    if (!Number.isFinite(rawMarks) || !Number.isFinite(examMax) || examMax <= 0) return;
    obtained += rawMarks;
    max += examMax;
  });

  if (max <= 0) return null;
  return {
    obtained: Number(obtained.toFixed(1)),
    max: Number(max.toFixed(1)),
    percentage: Number((clamp((obtained / max) * 100, 0, 100)).toFixed(1)),
  };
};
