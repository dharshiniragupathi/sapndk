const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const STAFF_DEPARTMENT_KEY = "staffDepartment";

export const getAuthToken = () => sessionStorage.getItem(TOKEN_KEY) || "";

export const getAuthRole = () => sessionStorage.getItem(ROLE_KEY) || "";

export const setAuthSession = (token, role) => {
  sessionStorage.setItem(TOKEN_KEY, String(token || ""));
  sessionStorage.setItem(ROLE_KEY, String(role || ""));

  // Clear legacy shared storage so different tabs do not overwrite each other.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(STAFF_DEPARTMENT_KEY);

  // Also clear old keys from localStorage used by previous builds.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(STAFF_DEPARTMENT_KEY);
};

export const getStaffDepartment = () =>
  sessionStorage.getItem(STAFF_DEPARTMENT_KEY) ||
  localStorage.getItem(STAFF_DEPARTMENT_KEY) ||
  "";
