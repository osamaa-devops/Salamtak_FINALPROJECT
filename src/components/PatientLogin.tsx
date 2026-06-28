import { AuthPortal } from "./AuthPortal";
import { AuthResult } from "../services/api";
export function PatientLogin(props: { onBack: () => void; onLogin: (result: AuthResult) => void }) { return <AuthPortal initialRole="patient" {...props} />; }
