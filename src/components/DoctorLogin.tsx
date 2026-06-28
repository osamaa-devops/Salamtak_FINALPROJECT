import { AuthPortal } from "./AuthPortal";
import { AuthResult } from "../services/api";
export function DoctorLogin(props: { onBack: () => void; onLogin: (result: AuthResult) => void }) { return <AuthPortal initialRole="doctor" {...props} />; }
