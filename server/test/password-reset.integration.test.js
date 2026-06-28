import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { PatientProfile } from "../src/models/PatientProfile.js";
import { DoctorProfile } from "../src/models/DoctorProfile.js";
import { PasswordReset } from "../src/models/PasswordReset.js";
import { loginUser, registerUser } from "../src/services/authService.js";
import { requestPasswordReset, resetPassword, verifyPasswordResetOtp } from "../src/services/passwordResetService.js";

const runId = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
const users = [
  { role: "patient", name: "Reset Patient", email: `reset-patient-${runId}@example.com`, phone: `011${runId.slice(-8)}` },
  { role: "doctor", name: "Reset Doctor", email: `reset-doctor-${runId}@example.com`, specialty: "Cardiology" },
];
const oldPassword = "OldPassword123!";
const newPassword = "NewPassword456!";

before(async () => { await connectDB(); });
after(async () => {
  const records = await User.find({ email: { $in: users.map(user => user.email) } }).select("_id");
  const ids = records.map(user => user._id);
  await Promise.all([
    PasswordReset.deleteMany({ user: { $in: ids } }),
    PatientProfile.deleteMany({ user: { $in: ids } }),
    DoctorProfile.deleteMany({ user: { $in: ids } }),
  ]);
  await User.deleteMany({ _id: { $in: ids } });
  await disconnectDB();
});

for (const account of users) {
  test(`${account.role} can reset password with a six-digit email OTP`, async () => {
    await registerUser({ ...account, password: oldPassword, consultationType: "both" });
    let deliveredOtp = "";
    await requestPasswordReset(
      { role: account.role, email: account.email },
      { sendOtp: async ({ otp }) => { deliveredOtp = otp; } },
    );
    assert.match(deliveredOtp, /^\d{6}$/);

    await assert.rejects(
      verifyPasswordResetOtp({ role: account.role, email: account.email, otp: "000000" }),
      (error) => error?.statusCode === 400,
    );
    const verified = await verifyPasswordResetOtp({ role: account.role, email: account.email, otp: deliveredOtp });
    assert.ok(verified.resetToken.length >= 32);
    await resetPassword({ resetToken: verified.resetToken, password: newPassword });

    await assert.rejects(
      loginUser({ role: account.role, email: account.email, password: oldPassword }),
      (error) => error?.statusCode === 401,
    );
    const loggedIn = await loginUser({ role: account.role, email: account.email, password: newPassword });
    assert.equal(loggedIn.user.email, account.email);
    await assert.rejects(resetPassword({ resetToken: verified.resetToken, password: oldPassword }));
  });
}
