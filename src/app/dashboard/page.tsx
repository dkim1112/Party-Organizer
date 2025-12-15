"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  getCurrentEvent,
  getUserByKakaoId,
  cancelRegistration,
  getMenuItems,
  getQuestionnaireAnswers,
} from "@/lib/firestore";
import { MenuItem } from "@/types";

interface UserInfo {
  name: string;
  phoneNumber: string;
  gender: "male" | "female";
  age: number;
  paymentStatus: "completed" | "pending" | "failed";
}

interface EventInfo {
  date: string;
  time: string;
  location: string;
  mcName: string;
  description: string;
  rules: string[];
}

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "김철수",
    phoneNumber: "010-1234-5678",
    gender: "male",
    age: 99,
    paymentStatus: "completed",
  });
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [hasQuestionnaireAnswers, setHasQuestionnaireAnswers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const uniqueId = Math.random().toString(36).substr(2, 9);

    // Load user data and event data
    const loadData = async () => {
      try {
        // Load user data from session storage
        const paymentResultData = sessionStorage.getItem("paymentResult");
        const pendingUserData = sessionStorage.getItem("pendingUser");
        console.log(
          "- paymentResult:",
          paymentResultData ? "EXISTS" : "MISSING"
        );
        console.log("- pendingUser:", pendingUserData ? "EXISTS" : "MISSING");

        let userData = null;
        let paymentStatus = "pending";

        if (paymentResultData) {
          const paymentResult = JSON.parse(paymentResultData);

          if (paymentResult.success) {
            userData = paymentResult.userData;
            paymentStatus = "completed";
          } else {
            console.log("❌ Payment was not successful");
          }
        } else if (pendingUserData) {
          userData = JSON.parse(pendingUserData);
          paymentStatus = "pending";
        }

        if (userData) {
          setUserInfo({
            name: userData.name || "사용자",
            phoneNumber: userData.phoneNumber || "010-0000-0000",
            gender: userData.gender || "male",
            age: parseInt(userData.age) || 99,
            paymentStatus: paymentStatus as "completed" | "pending" | "failed",
          });
        }

        // Load event data from Firestore
        const currentEvent = await getCurrentEvent();

        if (currentEvent) {
          setCurrentEventId(currentEvent.id);

          // Convert Firestore timestamp to readable date
          const eventDate = (currentEvent.date as any).toDate
            ? (currentEvent.date as any).toDate()
            : new Date(currentEvent.date as any);

          setEventInfo({
            date: eventDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            }),
            time: currentEvent.time || "시간 미정",
            location: currentEvent.location || "장소 미정",
            mcName: currentEvent.mcName || "MC 미정",
            description: currentEvent.description || "이벤트 설명이 없습니다.",
            rules: currentEvent.rules || ["설정된 규칙이 아직 없습니다."],
          });
        } else {
          // Set default event info if no event is found
          setEventInfo({
            date: "이벤트 날짜 미정",
            time: "시간 미정",
            location: "장소 미정",
            mcName: "MC 미정",
            description: "현재 활성화된 이벤트가 없습니다.",
            rules: ["설정된 규칙이 아직 없습니다."],
          });
        }

        // Load menu items from Firestore
        const menuData = await getMenuItems();
        setMenuItems(menuData);

        // Check questionnaire status if we have user and event data
        if (userData && userData.kakaoId && currentEvent) {
          // Get user from database to get their ID
          const user = await getUserByKakaoId(userData.kakaoId);
          if (user) {
            setCurrentUserId(user.id);

            // Check if user has already submitted questionnaire
            const existingAnswers = await getQuestionnaireAnswers(
              user.id,
              currentEvent.id
            );
            setHasQuestionnaireAnswers(existingAnswers !== null);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, []);

  const [activeTab, setActiveTab] = useState<"event" | "profile">("event");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCancelRegistration = async () => {
    if (
      confirm(
        "정말로 참가를 취소하시겠습니까? 취소 정책에 따라 수수료가 발생할 수 있습니다."
      )
    ) {
      setIsLoading(true);
      try {
        // Get current user data from session storage
        const pendingUserData = sessionStorage.getItem("pendingUser");
        const paymentResultData = sessionStorage.getItem("paymentResult");

        if (!pendingUserData && !paymentResultData) {
          throw new Error("사용자 정보를 찾을 수 없습니다");
        }

        let userData = null;
        if (paymentResultData) {
          const paymentResult = JSON.parse(paymentResultData);
          userData = paymentResult.userData;
        } else if (pendingUserData) {
          userData = JSON.parse(pendingUserData);
        }

        if (!userData || !userData.kakaoId) {
          throw new Error("사용자 정보가 올바르지 않습니다");
        }

        // Get user from database
        const user = await getUserByKakaoId(userData.kakaoId);
        if (!user) {
          throw new Error("데이터베이스에서 사용자를 찾을 수 없습니다");
        }

        // Get current event
        const currentEvent = await getCurrentEvent();
        if (!currentEvent) {
          throw new Error("활성 이벤트를 찾을 수 없습니다");
        }

        // Cancel the registration
        await cancelRegistration(user.id, currentEvent.id);

        // Clear session storage
        sessionStorage.removeItem("pendingUser");
        sessionStorage.removeItem("paymentResult");
        localStorage.clear();

        alert(
          "참가가 취소 되었습니다. 환불 문의는 DM: yeonrim_bar로 진행 해주세요."
        );
        router.push("/");
      } catch (error: any) {
        alert(`취소 처리 중 오류가 발생했습니다: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuestionnaireClick = () => {
    if (hasQuestionnaireAnswers) {
      // View existing answers
      router.push(
        `/questionnaire?view=true&userId=${currentUserId}&eventId=${currentEventId}`
      );
    } else {
      // Create new questionnaire
      router.push("/questionnaire");
    }
  };

  return (
    <AppLayout title="🎉 꺄르륵 파티 🎉">
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900">
            환영합니다, {userInfo.name}님! 🎊
          </h2>
          <p className="text-gray-600 text-sm">
            참가 신청이 성공적으로 완료 되었어요.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("event")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "event"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            이벤트 정보
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            내 정보
          </button>
        </div>

        {/* Event Tab */}
        {activeTab === "event" && !eventInfo && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" text="이벤트 정보를 불러오는 중..." />
          </div>
        )}
        {activeTab === "event" && eventInfo && (
          <div className="space-y-4">
            {/* Event Details */}
            {/* Questionnaire */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center justify-between">
                  <span>💕 사전 질문지 (필수!)</span>
                  {hasQuestionnaireAnswers && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      완료
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-purple-700">
                  {hasQuestionnaireAnswers
                    ? "작성하신 질문지를 다시 확인할 수 있어요."
                    : "본인에게 관심있는 상대방이 보게 될 거에요."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleQuestionnaireClick}
                  className={`w-full ${
                    hasQuestionnaireAnswers
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {hasQuestionnaireAnswers
                    ? "내 설문 보기 👀"
                    : "작성하러 가기 ✨"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>이벤트 상세 정보</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">날짜</span>
                    <span className="font-medium">{eventInfo.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">시간</span>
                    <span className="font-medium">{eventInfo.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">장소</span>
                    <span className="font-medium">{eventInfo.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MC</span>
                    <span className="font-medium">{eventInfo.mcName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Description */}
            <Card>
              <CardHeader>
                <CardTitle>🎪 꺄르륵 파티란?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {eventInfo.description}
                </p>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card>
              <CardHeader>
                <CardTitle>📋 참가 수칙</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {eventInfo.rules.map((rule, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-2 text-gray-700"
                    >
                      <span className="text-purple-600 mt-1">•</span>
                      <span className="text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Menu */}
            {menuItems.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center space-x-2">
                    <span>🥃</span>
                    <span>주류 라인업</span>
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    당일 제공되는 것들이에요 (마음속으로 택1).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {menuItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 py-2"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-orange-800">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-sm text-gray-800 font-medium">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>👤</span>
                    <span>내 정보</span>
                  </div>
                  <Badge
                    variant={
                      userInfo.paymentStatus === "completed"
                        ? "default"
                        : "destructive"
                    }
                    className={
                      userInfo.paymentStatus === "completed"
                        ? "bg-green-500"
                        : ""
                    }
                  >
                    {userInfo.paymentStatus === "completed"
                      ? "결제 완료"
                      : "결제 대기"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">이름</span>
                    <span className="font-medium">{userInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전화번호</span>
                    <span className="font-medium">{userInfo.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">성별</span>
                    <span className="font-medium">
                      {userInfo.gender === "male" ? "남성" : "여성"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">나이</span>
                    <span className="font-medium">{userInfo.age}세</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>📞 문의 및 지원</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>이벤트 문의:</strong> DM: yeonrim_bar
                  </p>
                  <p>
                    <strong>결제 문의:</strong> DM: yeonrim_bar
                  </p>
                  <p>
                    <strong>웹사이트 오류:</strong> 010-6749-1894로 문자
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">⚠️ 참가 취소</CardTitle>
                <CardDescription className="text-red-600">
                  취소 정책을 꼼꼼히 확인 후 결정해주세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-red-50 p-3 rounded-md text-xs text-red-700">
                  <ul className="space-y-1">
                    <li>• 이벤트 하루 전까지: 100% 환불</li>
                    <li>• 이벤트 당일: 환불 불가</li>
                  </ul>
                </div>
                <Button
                  onClick={handleCancelRegistration}
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : "참가 취소하기"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Message */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>우리 조만간 봐요 :)</p>
          <p>화면 오류 발생 시, 다시 로딩 시도!</p>
        </div>
      </div>
    </AppLayout>
  );
}
