import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { registerUser, loginUser } from "../src/services/authService.js";
import { User } from "../src/models/User.js";
import { PatientProfile } from "../src/models/PatientProfile.js";
import { DoctorProfile } from "../src/models/DoctorProfile.js";

const runId = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
const patientPhone = `010${runId.slice(-8)}`;
const doctorEmail = `auth-doctor-${runId}@example.com`;
const brokenDoctorEmail = `auth-broken-${runId}@example.com`;
const password = "TestPassword123!";

before(async () => { await connectDB(); });
after(async () => {
  const users = await User.find({ $or: [{ phone: patientPhone }, { email: { $in: [doctorEmail, brokenDoctorEmail] } }] }).select("_id");
  const ids = users.map((user) => user._id);
  await Promise.all([PatientProfile.deleteMany({ user: { $in: ids } }), DoctorProfile.deleteMany({ user: { $in: ids } })]);
  await User.deleteMany({ _id: { $in: ids } });
  await disconnectDB();
});

test("patient can create an account and sign in with phone", async () => {
  const registered = await registerUser({ role: "patient", name: "Auth Test Patient", phone: patientPhone, password, gender: "male" });
  assert.equal(registered.user.role, "patient");
  assert.ok(registered.token);
  assert.ok(await PatientProfile.exists({ user: registered.user._id }));

  const loggedIn = await loginUser({ role: "patient", phone: patientPhone, password });
  assert.equal(String(loggedIn.user._id), String(registered.user._id));
  assert.ok(loggedIn.token);
});

test("doctor can create an account and sign in with normalized email", async () => {
  const registered = await registerUser({ role: "doctor", name: "Auth Test Doctor", email: doctorEmail.toUpperCase(), password, specialty: "Cardiology", consultationType: "both" });
  assert.equal(registered.user.role, "doctor");
  assert.equal(registered.user.email, doctorEmail);
  assert.ok(await DoctorProfile.exists({ user: registered.user._id }));

  const loggedIn = await loginUser({ role: "doctor", email: ` ${doctorEmail.toUpperCase()} `, password });
  assert.equal(String(loggedIn.user._id), String(registered.user._id));
});

test("duplicate patient identifier returns a useful conflict", async () => {
  await assert.rejects(
    registerUser({ role: "patient", name: "Duplicate Patient", phone: patientPhone, password }),
    (error) => error?.statusCode === 409 && error.message.includes("already exists"),
  );
});

test("failed profile creation does not leave an orphan duplicate user", async () => {
  await assert.rejects(registerUser({ role: "doctor", name: "Broken Doctor", email: brokenDoctorEmail, password }));
  assert.equal(await User.exists({ email: brokenDoctorEmail }), null);
});
