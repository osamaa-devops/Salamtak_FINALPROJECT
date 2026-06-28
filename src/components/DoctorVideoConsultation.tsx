import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  Monitor,
  MonitorOff,
  User,
  AlertCircle,
  Heart,
  X,
  Bell,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";

interface Patient {
  id: string;
  source: "appointment" | "consultation";
  patientUserId: string;
  name: string;
  age: number | string;
  symptoms: string;
  appointmentTime: string;
  medicalHistory: string[];
  bookingDate: string;
  status: "waiting" | "in-progress" | "completed" | "cancelled";
}

interface ChatMessage {
  id: number;
  sender: "patient" | "doctor";
  message: string;
  timestamp: Date;
}

interface Notification {
  id: number;
  type: "appointment" | "reminder" | "update" | "alert";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export function DoctorVideoConsultation() {
  const { language } = useApp();
  const { data: appointmentData } = useAsyncData(() => api.appointments(), []);
  const { data: consultationData } = useAsyncData(() => api.consultations(), []);
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    ChatMessage[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [consultationNotes, setConsultationNotes] =
    useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const patientVideoRef = useRef<HTMLVideoElement>(null);

  const appointmentPatients: Patient[] = (appointmentData || [])
    .filter((appointment) => appointment.type === "video")
    .map((appointment) => ({
      id: appointment._id,
      source: "appointment",
      patientUserId: appointment.patient?._id,
      name: appointment.patient?.name || "",
      age: "-",
      symptoms: appointment.symptoms || "",
      appointmentTime: appointment.time,
      medicalHistory: [],
      bookingDate: appointment.date ? new Date(appointment.date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US") : "",
      status: appointment.status === "completed" ? "completed" : appointment.status === "cancelled" ? "cancelled" : "waiting",
    }));

  const instantPatients: Patient[] = (consultationData || [])
    .filter((consultation) => consultation.status !== "cancelled")
    .map((consultation) => ({
      id: consultation._id,
      source: "consultation",
      patientUserId: consultation.patient?._id,
      name: consultation.patient?.name || "",
      age: "-",
      symptoms: consultation.symptoms || "",
      appointmentTime: new Date(consultation.createdAt).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }),
      medicalHistory: [],
      bookingDate: new Date(consultation.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US"),
      status: consultation.status === "completed" ? "completed" : "waiting",
    }));

  const scheduledPatients: Patient[] = [...instantPatients, ...appointmentPatients];

  useEffect(() => {
    if (isInCall && videoRef.current) {
      // Try to access media devices only if available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((error) => {
            // Only show error if it's a permission issue, not device not found
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              toast.error("يرجى السماح بالوصول للكاميرا والميكروفون");
            }
          });
      }
    }

    return () => {
      // Cleanup: stop video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isInCall]);

  useEffect(() => {
    setNotifications(
      scheduledPatients.map((patient, index) => ({
        id: index + 1,
        type: "appointment",
        title: language === "ar" ? "موعد فيديو" : "Video Appointment",
        message:
          language === "ar"
            ? `لديك موعد مع ${patient.name} في الساعة ${patient.appointmentTime}`
            : `You have an appointment with ${patient.name} at ${patient.appointmentTime}`,
        timestamp: new Date(),
        isRead: false,
      })),
    );
  }, [appointmentData, consultationData, language]);

  const startConsultation = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsInCall(true);
    toast.success(language === 'ar' ? `تم بدء الاستشارة مع ${patient.name}` : `Consultation started with ${patient.name}`);

    // Add initial chat message
    setChatMessages([
      {
        id: 1,
        sender: "patient",
        message: language === 'ar' ? `مرحباً دكتور، أشعر بـ ${patient.symptoms}` : `Hello doctor, I'm experiencing ${patient.symptoms}`,
        timestamp: new Date(),
      },
    ]);
  };

  const endConsultation = async () => {
    if (selectedPatient) {
      try {
        if (diagnosis && treatment) {
          await api.createPrescription({
            patient: selectedPatient.patientUserId,
            ...(selectedPatient.source === "appointment" ? { appointment: selectedPatient.id } : {}),
            diagnosis,
            medications: [
              {
                name: treatment,
                dosage: language === "ar" ? "حسب تعليمات الطبيب" : "As directed",
                frequency: "",
                duration: "",
                instructions: consultationNotes,
              },
            ],
            notes: consultationNotes,
          });
        }
        if (selectedPatient.source === "appointment") {
          await api.updateAppointment(selectedPatient.id, { status: "completed" });
        } else {
          await api.endConsultation(selectedPatient.id);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : language === "ar" ? "تعذر حفظ التقرير الطبي" : "Unable to save medical report");
        return;
      }
      toast.success(
        language === 'ar' ? `تم إنهاء الاستشارة مع ${selectedPatient.name} وحفظ التقرير الطبي` : `Consultation ended with ${selectedPatient.name} and medical report saved`,
      );
    }

    setIsInCall(false);
    setSelectedPatient(null);
    setChatMessages([]);
    setConsultationNotes("");
    setDiagnosis("");
    setTreatment("");
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: chatMessages.length + 1,
      sender: "doctor",
      message: newMessage,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, message]);
    if (selectedPatient?.source === "consultation") {
      api.addConsultationMessage(selectedPatient.id, newMessage).catch(() => undefined);
    }
    setNewMessage("");

  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    toast.info(
      language === 'ar' ? (isCameraOn ? "تم إيقاف الكاميرا" : "تم تشغيل الكاميرا") : (isCameraOn ? "Camera turned off" : "Camera turned on"),
    );
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    toast.info(language === 'ar' ? (isMicOn ? "تم كتم الصوت" : "تم تشغيل الصوت") : (isMicOn ? "Microphone muted" : "Microphone unmuted"));
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.info(
      language === 'ar' ? (isScreenSharing
        ? "تم إيقاف مشاركة الشاشة"
        : "تم بدء مشاركة الشاشة") : (isScreenSharing ? "Screen sharing stopped" : "Screen sharing started"),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting":
        return language === 'ar' ? "في الانتظار" : "Waiting";
      case "in-progress":
        return language === 'ar' ? "جاري الآن" : "In Progress";
      case "completed":
        return language === 'ar' ? "مكتملة" : "Completed";
      case "cancelled":
        return language === 'ar' ? "ملغية" : "Cancelled";
      default:
        return language === 'ar' ? "غير محدد" : "Unknown";
    }
  };

  const removeNotification = (notificationId: number) => {
    setNotifications((prev) =>
      prev.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
    toast.success("تم حذف الإشعار");
  };

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return Calendar;
      case "reminder":
        return Bell;
      case "update":
        return CheckCircle;
      case "alert":
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "appointment":
        return "text-blue-600";
      case "reminder":
        return "text-yellow-600";
      case "update":
        return "text-green-600";
      case "alert":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (isInCall && selectedPatient) {
    return (
      <div
        className="h-screen bg-gray-900 text-white"
        dir="rtl"
      >
        {/* Video Call Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
          {/* Main Video Area */}
          <div className="lg:col-span-3 relative">
            {/* Patient's Video */}
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <video
                ref={patientVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarFallback className="text-4xl">
                      {selectedPatient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold">
                    {selectedPatient.name}
                  </h2>
                  <p className="text-gray-400">
                    {selectedPatient.age} {language === 'ar' ? 'سنة' : 'years old'}
                  </p>
                  <Badge className="mt-2">
                    {language === 'ar' ? 'الوقت:' : 'Time:'} {selectedPatient.appointmentTime}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Doctor's Video (Picture in Picture) */}
            <div className="absolute top-4 left-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-600">
                  <VideoOff className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 rounded px-2 py-1 text-xs">
                أنت
              </div>
            </div>

            {/* Patient Info Overlay */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-md">
              <h3 className="font-semibold mb-2">
                {language === 'ar' ? 'معلومات المريض' : 'Patient Information'}
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-300">
                    {language === 'ar' ? 'الأعراض:' : 'Symptoms:'}
                  </span>{" "}
                  {selectedPatient.symptoms}
                </p>
                <p>
                  <span className="text-gray-300">
                    {language === 'ar' ? 'التاريخ المرضي:' : 'Medical History:'}
                  </span>{" "}
                  {selectedPatient.medicalHistory.join(", ")}
                </p>
                <p>
                  <span className="text-gray-300">
                    {language === 'ar' ? 'تاريخ الحجز:' : 'Booking Date:'}
                  </span>{" "}
                  {selectedPatient.bookingDate}
                </p>
              </div>
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-4 bg-gray-800 px-6 py-3 rounded-full">
                <Button
                  variant={
                    isCameraOn ? "secondary" : "destructive"
                  }
                  size="sm"
                  onClick={toggleCamera}
                  className="rounded-full w-12 h-12"
                >
                  {isCameraOn ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant={
                    isMicOn ? "secondary" : "destructive"
                  }
                  size="sm"
                  onClick={toggleMic}
                  className="rounded-full w-12 h-12"
                >
                  {isMicOn ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant={
                    isScreenSharing ? "default" : "secondary"
                  }
                  size="sm"
                  onClick={toggleScreenShare}
                  className="rounded-full w-12 h-12"
                >
                  {isScreenSharing ? (
                    <Monitor className="h-5 w-5" />
                  ) : (
                    <MonitorOff className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className="rounded-full w-12 h-12"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={endConsultation}
                  className="rounded-full w-12 h-12"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1 bg-gray-100 text-black flex flex-col">
            {/* Medical Notes */}
            <div className="p-4 bg-white border-b">
              <h3 className="font-semibold mb-4">
                {language === 'ar' ? 'التقرير الطبي' : 'Medical Report'}
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'التشخيص' : 'Diagnosis'}</Label>
                  <Textarea
                    placeholder={language === 'ar' ? 'اكتب التشخيص...' : 'Write diagnosis...'}
                    value={diagnosis}
                    onChange={(e) =>
                      setDiagnosis(e.target.value)
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'العلاج المقترح' : 'Recommended Treatment'}</Label>
                  <Textarea
                    placeholder={language === 'ar' ? 'اكتب العلاج...' : 'Write treatment...'}
                    value={treatment}
                    onChange={(e) =>
                      setTreatment(e.target.value)
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Textarea
                    placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                    value={consultationNotes}
                    onChange={(e) =>
                      setConsultationNotes(e.target.value)
                    }
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Chat */}
            {showChat && (
              <div className="flex-1 flex flex-col">
                <div className="p-3 bg-white border-b">
                  <h4 className="font-medium">{language === 'ar' ? 'المحادثة' : 'Chat'}</h4>
                </div>

                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs p-2 rounded-lg text-sm ${
                          msg.sender === "doctor"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString(
                            "ar-EG",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white border-t">
                  <div className="flex space-x-reverse space-x-2">
                    <Input
                      placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                      value={newMessage}
                      onChange={(e) =>
                        setNewMessage(e.target.value)
                      }
                      onKeyPress={(e) =>
                        e.key === "Enter" && sendMessage()
                      }
                      className="flex-1 text-sm"
                    />
                    <Button size="sm" onClick={sendMessage}>
                      {language === 'ar' ? 'إرسال' : 'Send'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (false) return (
    <div className="workspace-page care-page doctor-consultations-page max-w-6xl mx-auto p-6 space-y-6 dark:bg-gray-900 min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="care-page-head text-center mb-8">
        <span className="care-kicker">{language === 'ar' ? 'إدارة الجلسات' : 'Session management'}</span>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">
          {language === 'ar' ? 'المرضى المحجوزين للاستشارة المرئية' : 'Patients Booked for Video Consultation'}
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          {language === 'ar' ? 'المرضى الذين لديهم اجتماعات مجدولة ويمكنك الاتصال بهم' : 'Patients with scheduled appointments you can call'}
        </p>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-reverse space-x-2 dark:text-white">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>
                {language === 'ar' ? 'الإشعارات' : 'Notifications'} (
                {notifications.filter((n) => !n.isRead).length}{" "}
                {language === 'ar' ? 'غير مقروءة' : 'unread'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(
                  notification.type,
                );
                const colorClass = getNotificationColor(
                  notification.type,
                );

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start justify-between p-4 rounded-lg border transition-all hover:shadow-sm ${
                      notification.isRead
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-blue-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start space-x-reverse space-x-3 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.isRead
                            ? "bg-gray-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 ${notification.isRead ? "text-gray-600" : colorClass}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-reverse space-x-2 mb-1">
                          <h4
                            className={`font-medium ${notification.isRead ? "text-gray-600" : "text-gray-900"}`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p
                          className={`text-sm ${notification.isRead ? "text-gray-500" : "text-gray-700"}`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.timestamp.toLocaleTimeString(
                            "ar-EG",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            markAsRead(notification.id)
                          }
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeNotification(notification.id)
                        }
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Alert */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-reverse space-x-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-200">
                {language === 'ar' ? `ليك ${scheduledPatients.length} مريض محجوز للاستشارة المرئية اليوم` : `You have ${scheduledPatients.length} patients booked for video consultation today`}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {language === 'ar' ? 'جميع المرضى في حالة انتظار ويمكنك بدء الاستشارة معهم فوراً' : 'All patients are waiting and you can start the consultation immediately'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2 dark:text-white">
            <User className="h-5 w-5" />
            <span>{language === 'ar' ? 'المرى المحجوزين للاستشارة' : 'Booked Patients for Consultation'}</span>
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            {language === 'ar' ? 'جميع المرضى الذين لديهم اجتماعات مجدولة اليوم ويمكنك الاتصال بهم' : 'All patients with scheduled appointments today you can call'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {scheduledPatients.map((patient) => (
              <Card
                key={patient.id}
                className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-reverse space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-lg">
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {patient.age} {language === 'ar' ? 'سنة' : 'years old'}
                        </p>
                        <div className="flex items-center space-x-reverse space-x-2 mt-1">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            {patient.appointmentTime}
                          </span>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {patient.bookingDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-2">
                        {language === 'ar' ? 'محجوز ومتاح للاتصال' : 'Booked & Available'}
                      </Badge>
                      <div>
                        <Button
                          onClick={() =>
                            startConsultation(patient)
                          }
                          className="bg-green-600 hover:bg-green-700 w-full"
                        >
                          <Video className="h-4 w-4 ml-2" />
                          {language === 'ar' ? 'بدء الاستشارة الآن' : 'Start Consultation Now'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {language === 'ar' ? 'الأعراض:' : 'Symptoms:'}{" "}
                      </span>
                      <span className="text-sm">
                        {patient.symptoms}
                      </span>
                    </div>
                    {patient.medicalHistory.length > 0 &&
                      patient.medicalHistory[0] !==
                        (language === 'ar' ? "لا يوجد" : "None") && (
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {language === 'ar' ? 'التاريخ المرضي:' : 'Medical History:'}{" "}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {patient.medicalHistory.map(
                              (condition, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <AlertCircle className="h-3 w-3 ml-1" />
                                  {condition}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {scheduledPatients.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  لا يوجد مرضى محجوزين
                </h3>
                <p className="text-muted-foreground">
                  لا يوجد مرضى مجدولين للاستشارة المرئية في
                  الوقت الحالي
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule Overview */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">{language === 'ar' ? 'جدول الاستشارات اليوم' : 'Today\'s Consultation Schedule'}</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {language === 'ar' ? 'الأوقات المجدولة للاستشارات المرئية' : 'Scheduled times for video consultations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-reverse space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium dark:text-white">
                    {patient.appointmentTime}
                  </span>
                  <span className="text-muted-foreground dark:text-gray-400">
                    -
                  </span>
                  <span className="dark:text-white">{patient.name}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400"
                >
                  {language === 'ar' ? 'متاح للاتصال' : 'Available to Call'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const waitingPatients = scheduledPatients.filter((patient) => patient.status === "waiting");
  const completedPatients = scheduledPatients.filter((patient) => patient.status === "completed");
  const nextPatient = waitingPatients[0];
  const unreadNotifications = notifications.filter((notification) => !notification.isRead);

  return <div className="doctor-consultations-v2" dir={language === "ar" ? "rtl" : "ltr"}>
    <header className="consultations-v2-head"><div><span>{language === "ar" ? "غرفة الاستشارات" : "Consultation room"}</span><h2>{language === "ar" ? "استشارات اليوم" : "Today's consultations"}</h2><p>{language === "ar" ? "تابع قائمة الانتظار وابدأ الجلسة التالية بدون تشتت." : "Manage the waiting list and start the next session without distractions."}</p></div><div className="doctor-online"><i /><span><b>{language === "ar" ? "متاح للاستشارات" : "Available for calls"}</b><small>{language === "ar" ? "الغرفة جاهزة" : "Room is ready"}</small></span></div></header>

    <section className="consultations-summary">
      <div><span><Video /></span><p><b>{scheduledPatients.length}</b><small>{language === "ar" ? "استشارات اليوم" : "Today's sessions"}</small></p></div>
      <div><span><Clock /></span><p><b>{waitingPatients.length}</b><small>{language === "ar" ? "في قائمة الانتظار" : "Waiting"}</small></p></div>
      <div><span><CheckCircle /></span><p><b>{completedPatients.length}</b><small>{language === "ar" ? "جلسات مكتملة" : "Completed"}</small></p></div>
      <div><span><Bell /></span><p><b>{unreadNotifications.length}</b><small>{language === "ar" ? "تنبيهات جديدة" : "New notifications"}</small></p></div>
    </section>

    <div className="consultations-layout">
      <main className="consultations-workspace">
        <section className="next-consultation">
          <header><div><Video /><span><b>{language === "ar" ? "الجلسة التالية" : "Next consultation"}</b><small>{language === "ar" ? "راجع الحالة قبل بدء الاتصال" : "Review the case before starting"}</small></span></div>{nextPatient && <time><Clock />{nextPatient.appointmentTime}</time>}</header>
          {nextPatient ? <div className="next-patient-content"><div className="next-patient-person"><span>{nextPatient.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><small>{language === "ar" ? "المريض" : "Patient"}</small><h3>{nextPatient.name}</h3><p><Calendar />{nextPatient.bookingDate}<i>•</i>{nextPatient.source === "consultation" ? (language === "ar" ? "طلب فوري" : "Instant request") : (language === "ar" ? "موعد محجوز" : "Booked appointment")}</p></div></div><div className="next-patient-symptoms"><span><Heart />{language === "ar" ? "سبب الاستشارة" : "Reason for consultation"}</span><p>{nextPatient.symptoms || (language === "ar" ? "لم يكتب المريض أعراضًا" : "No symptoms provided")}</p></div><button onClick={() => startConsultation(nextPatient)}><Video />{language === "ar" ? "بدء الاستشارة الآن" : "Start consultation"}</button></div> : <div className="consultations-empty compact"><span><CheckCircle /></span><h3>{language === "ar" ? "لا توجد جلسة منتظرة" : "No session is waiting"}</h3><p>{language === "ar" ? "ستظهر الجلسة التالية هنا تلقائيًا." : "The next session will appear here automatically."}</p></div>}
        </section>

        <section className="consultation-queue"><header><div><User /><span><b>{language === "ar" ? "قائمة الانتظار" : "Waiting list"}</b><small>{waitingPatients.length} {language === "ar" ? "مرضى بانتظارك" : "patients waiting"}</small></span></div><i>{language === "ar" ? "مرتبة حسب الموعد" : "Sorted by time"}</i></header><div className="consultation-queue-head"><span>{language === "ar" ? "المريض" : "Patient"}</span><span>{language === "ar" ? "الأعراض" : "Symptoms"}</span><span>{language === "ar" ? "الموعد" : "Time"}</span><span>{language === "ar" ? "نوع الطلب" : "Type"}</span><span /></div><div className="consultation-queue-list">
          {waitingPatients.map((patient, index) => <article key={`${patient.source}-${patient.id}`}><div className="queue-person"><span>{patient.name.slice(0, 1)}</span><p><b>{patient.name}</b><small>{language === "ar" ? `المريض رقم ${index + 1}` : `Patient #${index + 1}`}</small></p></div><p className="queue-symptoms">{patient.symptoms || "-"}</p><time><Clock />{patient.appointmentTime}<small>{patient.bookingDate}</small></time><span className={`queue-type ${patient.source}`}>{patient.source === "consultation" ? (language === "ar" ? "فورية" : "Instant") : (language === "ar" ? "محجوزة" : "Booked")}</span><button onClick={() => startConsultation(patient)}><Video />{language === "ar" ? "بدء" : "Start"}</button></article>)}
          {!waitingPatients.length && <div className="consultations-empty"><span><User /></span><h3>{language === "ar" ? "قائمة الانتظار فارغة" : "The waiting list is empty"}</h3><p>{language === "ar" ? "لا يوجد مرضى بانتظار الاتصال حاليًا." : "No patients are currently waiting for a call."}</p></div>}
        </div></section>
      </main>

      <aside className="consultations-side">
        <section className="consultation-timeline"><header><Calendar /><span><b>{language === "ar" ? "جدول اليوم" : "Today's schedule"}</b><small>{scheduledPatients.length} {language === "ar" ? "جلسات" : "sessions"}</small></span></header><div>{scheduledPatients.map((patient) => <button key={`timeline-${patient.source}-${patient.id}`} onClick={() => patient.status === "waiting" && startConsultation(patient)}><time>{patient.appointmentTime}</time><i className={patient.status} /><p><b>{patient.name}</b><small>{patient.status === "completed" ? (language === "ar" ? "مكتملة" : "Completed") : (language === "ar" ? "في الانتظار" : "Waiting")}</small></p></button>)}{!scheduledPatients.length && <div className="side-consultation-empty">{language === "ar" ? "لا توجد جلسات اليوم" : "No sessions today"}</div>}</div></section>
        <section className="consultation-alerts"><header><Bell /><span><b>{language === "ar" ? "التنبيهات" : "Notifications"}</b><small>{unreadNotifications.length} {language === "ar" ? "جديد" : "new"}</small></span></header><div>{notifications.slice(0, 4).map((notification) => <article key={notification.id} className={!notification.isRead ? "unread" : ""}><span><Bell /></span><div onClick={() => markAsRead(notification.id)}><b>{notification.title}</b><p>{notification.message}</p><small>{notification.timestamp.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}</small></div><button onClick={() => removeNotification(notification.id)}><X /></button></article>)}{!notifications.length && <div className="side-consultation-empty">{language === "ar" ? "لا توجد تنبيهات" : "No notifications"}</div>}</div></section>
      </aside>
    </div>
  </div>;
}
