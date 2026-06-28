import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
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
  Star,
  Monitor,
  MonitorOff,
  Heart,
  Shield,
  DollarSign
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  price: number;
  available: boolean;
  nextAvailable?: string;
}

interface ChatMessage {
  id: number;
  sender: 'patient' | 'doctor';
  message: string;
  timestamp: Date;
}

export function VideoConsultation() {
  const { t, dir, language } = useApp();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const { data: doctorData, isLoading, error } = useAsyncData(() => api.videoDoctors(), []);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const doctorVideoRef = useRef<HTMLVideoElement>(null);

  const doctors: Doctor[] = (doctorData || []).map((doctor) => ({
    id: doctor.user?._id,
    name: doctor.user?.name || "",
    specialty: doctor.specialty,
    rating: doctor.rating || 0,
    experience: doctor.experience || 0,
    price: doctor.fee || 0,
    available: doctor.isAvailableForVideo,
    nextAvailable: doctor.nextAvailable,
  }));

  useEffect(() => {
    if (isInCall && videoRef.current) {
      // Try to access media devices only if available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(error => {
            // Only show error if it's a permission issue, not device not found
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              toast.error(language === 'ar' ? 'يرجى السماح بالوصول للكاميرا والميكروفون' : 'Please allow access to camera and microphone');
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

  const startConsultation = async (doctor: Doctor) => {
    if (!symptoms.trim()) {
      toast.error(language === 'ar' ? 'يرجى كتابة وصف للأعراض' : 'Please write a description of the symptoms');
      return;
    }
    
    try {
      const consultation = await api.startConsultation({
        doctor: doctor.id,
        symptoms,
        price: doctor.price,
        initialMessage: symptoms,
      });
      setConsultationId(consultation._id);
      setSelectedDoctor(doctor);
      setIsInCall(true);
      setShowBookingDialog(false);
      toast.success(language === 'ar' ? `تم بدء الاستشارة مع ${doctor.name}` : `Consultation started with ${doctor.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : language === 'ar' ? 'تعذر بدء الاستشارة' : 'Unable to start consultation');
      return;
    }
    
    // Add initial chat message
    setChatMessages([{
      id: 1,
      sender: 'doctor',
      message: language === 'ar' 
        ? `مرحباً ${t('default.patient.name').split(' ')[0]}، أنا ${doctor.name}. كيف يمكنني مساعدتك اليوم؟`
        : `Hello ${t('default.patient.name').split(' ')[0]}, I'm ${doctor.name}. How can I help you today?`,
      timestamp: new Date()
    }]);
  };

  const endConsultation = async () => {
    if (consultationId) {
      await api.endConsultation(consultationId).catch(() => undefined);
    }
    setIsInCall(false);
    setSelectedDoctor(null);
    setConsultationId(null);
    setChatMessages([]);
    setSymptoms("");
    toast.success(language === 'ar' ? 'تم إنهاء الاستشارة بنجاح. سيتم إرسال التقرير الطبي إليك قريباً' : 'Consultation ended successfully. The medical report will be sent to you soon');
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: chatMessages.length + 1,
      sender: 'patient',
      message: newMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewMessage("");
    if (consultationId) {
      api.addConsultationMessage(consultationId, newMessage).catch(() => undefined);
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    toast.info(isCameraOn 
      ? (language === 'ar' ? 'تم إيقاف الكاميرا' : 'Camera turned off')
      : (language === 'ar' ? 'تم تشغيل الكاميرا' : 'Camera turned on'));
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    toast.info(isMicOn 
      ? (language === 'ar' ? 'تم كتم الصوت' : 'Microphone muted')
      : (language === 'ar' ? 'تم تشغيل الصوت' : 'Microphone unmuted'));
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.info(isScreenSharing 
      ? (language === 'ar' ? 'تم إيقاف مشاركة الشاشة' : 'Screen sharing stopped')
      : (language === 'ar' ? 'تم بدء مشاركة الشاشة' : 'Screen sharing started'));
  };

  if (isInCall && selectedDoctor) {
    return (
      <div className="h-screen bg-gray-900 dark:bg-gray-950 text-white" dir={dir}>
        {/* Video Call Interface for Patient */}
        <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
          {/* Main Video Area */}
          <div className="lg:col-span-3 relative">
            {/* Doctor's Video */}
            <div className="w-full h-full bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
              <video
                ref={doctorVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarFallback className="text-4xl">
                      {selectedDoctor.name.split(' ')[1]?.[0] || (language === 'ar' ? 'د' : 'D')}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold">{selectedDoctor.name}</h2>
                  <p className="text-gray-400">{selectedDoctor.specialty}</p>
                  <div className="flex items-center justify-center space-x-reverse space-x-1 mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{selectedDoctor.rating}</span>
                    <span className="text-gray-400">• {selectedDoctor.experience} {language === 'ar' ? 'سنة خبرة' : 'years experience'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Patient's Video (Picture in Picture) */}
            <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} w-48 h-36 bg-gray-700 rounded-lg overflow-hidden`}>
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
              <div className={`absolute bottom-2 ${dir === 'rtl' ? 'right-2' : 'left-2'} bg-black/50 rounded px-2 py-1 text-xs`}>
                {language === 'ar' ? 'أنت' : 'You'}
              </div>
            </div>
            
            {/* Consultation Info */}
            <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} bg-black/50 backdrop-blur-sm rounded-lg p-4 max-w-md`}>
              <h3 className="font-semibold mb-2">{language === 'ar' ? 'معلومات الاستشارة' : 'Consultation Info'}</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-300">{language === 'ar' ? 'المدة:' : 'Duration:'}</span> 30 {language === 'ar' ? 'دقيقة' : 'minutes'}</p>
                <p><span className="text-gray-300">{language === 'ar' ? 'الرسوم:' : 'Fee:'}</span> {selectedDoctor.price} {t('currency.short')}</p>
                <p><span className="text-gray-300">{language === 'ar' ? 'نوع الاستشارة:' : 'Type:'}</span> {language === 'ar' ? 'استشارة مرئية' : 'Video Consultation'}</p>
              </div>
            </div>
            
            {/* Call Controls */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-4 bg-gray-800 px-6 py-3 rounded-full">
                <Button
                  variant={isCameraOn ? "secondary" : "destructive"}
                  size="sm"
                  onClick={toggleCamera}
                  className="rounded-full w-12 h-12"
                >
                  {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant={isMicOn ? "secondary" : "destructive"}
                  size="sm"
                  onClick={toggleMic}
                  className="rounded-full w-12 h-12"
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
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
          
          {/* Chat Sidebar */}
          {showChat && (
            <div className="lg:col-span-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white flex flex-col">
              <div className="p-4 bg-white dark:bg-gray-700 border-b dark:border-gray-600">
                <h3 className="font-semibold">{language === 'ar' ? 'المحادثة مع الطبيب' : 'Chat with Doctor'}</h3>
              </div>
              
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        msg.sender === 'patient'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-700 border-t dark:border-gray-600">
                <div className="flex space-x-reverse space-x-2">
                  <Input
                    placeholder={language === 'ar' ? 'اكتب رسالة للطبيب...' : 'Type a message to the doctor...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage}>{language === 'ar' ? 'إرسال' : 'Send'}</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="video-v2" dir={dir}>
      <div className="video-v2-head">
        <span className="care-kicker">{language === 'ar' ? 'الرعاية عن بُعد' : 'Remote care'}</span>
        <h1 className="text-3xl font-bold mb-2">{t('video.title')}</h1>
        <p className="text-muted-foreground">{language === 'ar' ? 'تواصل مع الأطباء المختصين عن بعد من راحة منزلك' : 'Connect with specialized doctors remotely from the comfort of your home'}</p>
      </div>

      {/* Benefits Section */}
      <div className="video-v2-benefits grid md:grid-cols-3 gap-6 mb-8">
        <Card className="dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-medium mb-2">{language === 'ar' ? 'استشارة فورية' : 'Instant Consultation'}</h4>
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تواصل مع الطبيب فوراً دون انتظار أو سفر' : 'Connect with a doctor instantly without waiting or travel'}</p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-medium mb-2">{language === 'ar' ? 'آمان وخصوصية' : 'Safe & Private'}</h4>
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'محادثات مشفرة وبيانات آمنة تماماً' : 'Encrypted conversations and completely secure data'}</p>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-medium mb-2">{language === 'ar' ? 'أسعار مناسبة' : 'Affordable Prices'}</h4>
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'استشارات طبية بأسعار مناسبة للجميع' : 'Medical consultations at affordable prices for everyone'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Symptoms Input */}
      <Card className="video-symptoms-panel dark:bg-gray-800">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'وصف الأعراض والحالة' : 'Describe Symptoms and Condition'}</CardTitle>
          <CardDescription>{language === 'ar' ? 'اكتب وصفاً مفصلاً لحالتك والأعراض التي تعاني منها لمساعدة الطبيب في تقديم أفضل استشارة' : 'Write a detailed description of your condition and symptoms to help the doctor provide the best consultation'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={language === 'ar' ? 'مثال: أشعر بصداع مستمر منذ يومين مع دوخة خفيفة، الألم في منطقة الجبهة...' : 'Example: I have been experiencing a persistent headache for two days with mild dizziness...'}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Available Doctors */}
      <div className="video-doctors-section">
        <h2 className="text-2xl font-bold mb-6">{language === 'ar' ? 'الأطباء المتاحون للاستشارة المرئية' : 'Available Doctors for Video Consultation'}</h2>
        <div className="video-doctor-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading && <p className="text-center text-muted-foreground py-6">{language === 'ar' ? 'جاري تحميل الأطباء...' : 'Loading doctors...'}</p>}
              {error && <p className="text-center text-red-600 py-6">{error}</p>}
              {!isLoading && !error && doctors.length === 0 && <p className="text-center text-muted-foreground py-6">{language === 'ar' ? 'لا يوجد أطباء متاحون الآن' : 'No doctors available now'}</p>}
              {doctors.map((doctor) => (
            <Card key={doctor.id} className="video-doctor-card relative hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-reverse space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg">
                      {doctor.name.split(' ')[1]?.[0] || 'د'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{doctor.name}</CardTitle>
                    <p className="text-muted-foreground">{doctor.specialty}</p>
                    <div className="flex items-center space-x-reverse space-x-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{doctor.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({doctor.experience} {language === 'ar' ? 'سنة خبرة' : 'years experience'})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-4 left-4">
                  {doctor.available ? (
                    <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-400">{language === 'ar' ? 'متاح الآن' : 'Available Now'}</Badge>
                  ) : (
                    <Badge variant="secondary">{language === 'ar' ? `متاح ${doctor.nextAvailable}` : `Available ${doctor.nextAvailable}`}</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{doctor.price} {t('currency.short')}</span>
                    <span className="text-sm text-muted-foreground">30 {language === 'ar' ? 'دقيقة' : 'minutes'}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Video className="h-4 w-4" />
                      <span>{language === 'ar' ? 'استشارة مرئية مباشرة' : 'Live Video Consultation'}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{language === 'ar' ? 'مدة الاستشارة: 30 دقيقة' : 'Consultation Duration: 30 minutes'}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{language === 'ar' ? 'تقرير طبي مكتوب' : 'Written Medical Report'}</span>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{language === 'ar' ? 'محادثة مكتوبة ومرئية' : 'Text & Video Chat'}</span>
                    </div>
                  </div>
                  
                  <Dialog open={showBookingDialog && selectedDoctor?.id === doctor.id} onOpenChange={setShowBookingDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        disabled={!doctor.available || !symptoms.trim()}
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          if (symptoms.trim()) {
                            setShowBookingDialog(true);
                          }
                        }}
                      >
                        <Video className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                        {doctor.available ? (language === 'ar' ? 'بدء الاستشارة' : 'Start Consultation') : (language === 'ar' ? 'غير متاح' : 'Unavailable')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="video-confirm-dialog dark:bg-gray-800" dir={dir}>
                      <DialogHeader>
                        <DialogTitle>{language === 'ar' ? 'تأكيد الاستشارة المرئية' : 'Confirm Video Consultation'}</DialogTitle>
                        <DialogDescription>
                          {language === 'ar' ? 'مراجعة تفاصيل الاستشارة قبل البدء' : 'Review consultation details before starting'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedDoctor && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-reverse space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback>
                                {selectedDoctor.name.split(' ')[1]?.[0] || (language === 'ar' ? 'د' : 'D')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{selectedDoctor.name}</h4>
                              <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">{language === 'ar' ? 'تفاصيل الاستشارة:' : 'Consultation Details:'}</h4>
                            <ul className="text-sm space-y-1">
                              <li>• {language === 'ar' ? 'مدة الاستشارة: 30 دقيقة' : 'Consultation Duration: 30 minutes'}</li>
                              <li>• {language === 'ar' ? 'استشارة مرئية مباشرة' : 'Live Video Consultation'}</li>
                              <li>• {language === 'ar' ? 'تقرير طبي مكتوب' : 'Written Medical Report'}</li>
                              <li>• {language === 'ar' ? `الرسوم: ${selectedDoctor.price} ${t('currency.short')}` : `Fee: ${t('currency.short')} ${selectedDoctor.price}`}</li>
                            </ul>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">{language === 'ar' ? 'الأعراض المسجلة:' : 'Recorded Symptoms:'}</h4>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                              {symptoms}
                            </div>
                          </div>
                          
                          <div className="flex space-x-reverse space-x-2 pt-4">
                            <Button 
                              onClick={() => startConsultation(selectedDoctor)}
                              className="flex-1"
                            >
                              {language === 'ar' ? 'تأكيد وبدء الاستشارة' : 'Confirm & Start Consultation'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowBookingDialog(false)}
                            >
                              {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <Card className="video-how-card dark:bg-gray-800">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'كيف تعمل الاستشارة المرئية؟' : 'How Does Video Consultation Work?'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h4 className="font-medium mb-1">{language === 'ar' ? 'اكتب الأعراض' : 'Write Symptoms'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'صف حالتك بالتفصيل' : 'Describe your condition in detail'}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-green-600 dark:text-green-400">2</span>
              </div>
              <h4 className="font-medium mb-1">{language === 'ar' ? 'اختر الطبيب' : 'Choose Doctor'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اختر الطبيب المناسب' : 'Select the right doctor'}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-orange-600 dark:text-orange-400">3</span>
              </div>
              <h4 className="font-medium mb-1">{language === 'ar' ? 'ابدأ الاستشارة' : 'Start Consultation'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تواصل مع الطبيب مباشرة' : 'Connect with the doctor directly'}</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold text-purple-600 dark:text-purple-400">4</span>
              </div>
              <h4 className="font-medium mb-1">{language === 'ar' ? 'احصل على التقرير' : 'Get Report'}</h4>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تقرير طبي مفصل' : 'Detailed medical report'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
