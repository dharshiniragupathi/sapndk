import { Navigate } from "react-router-dom";
import { getAuthRole, getAuthToken } from "../../utils/authStorage";

function ProtectedRoute({ children, roleRequired }) {
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token) {
    return <Navigate to="/" />;
  }

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
