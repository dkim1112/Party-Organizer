"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMenuItem, getMenuItems, deleteMenuItem } from "@/lib/firestore";
import { getQuestions, deleteQuestion, createQuestion } from "@/lib/firestore";
import {
  getCurrentEvent,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getAllRegistrationsByStatus,
  getAllQuestionnaireAnswers,
} from "@/lib/firestore";
import { MenuItem, Question } from "@/types";
import { generateFullReport } from "@/lib/pdf-generator";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "questions" | "menu" | "approvals" | "reports"
  >("approvals");

  // Questions state
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsResult, setQuestionsResult] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    subtitle: "",
    type: "text" as Question["type"],
    required: true,
  });

  // Menu state
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuResult, setMenuResult] = useState<string>("");
  const [newItemName, setNewItemName] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Approvals state
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsResult, setApprovalsResult] = useState<string>("");
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [eventStats, setEventStats] = useState<{
    approvedMale: number;
    approvedFemale: number;
    pendingMale: number;
    pendingFemale: number;
    maxMale: number;
    maxFemale: number;
  } | null>(null);

  // Reports state
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsResult, setReportsResult] = useState<string>("");

  // Questions functions
  const loadQuestions = async () => {
    try {
      const questionData = await getQuestions();
      setQuestions(questionData);
    } catch (error) {
      console.error("Failed to load questions:", error);
    }
  };

  const handleLoadQuestions = async () => {
    setQuestionsLoading(true);
    await loadQuestions();
    setQuestionsLoading(false);
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm(`정말로 "${question.title}" 질문을 삭제하시겠습니까?`)) {
      return;
    }

    setQuestionsLoading(true);
    setQuestionsResult("");

    try {
      await deleteQuestion(question.id);
      setQuestionsResult(`✅ Successfully deleted question: ${question.title}`);
      await loadQuestions();
    } catch (error: any) {
      setQuestionsResult(`❌ Error deleting question: ${error.message}`);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.title.trim()) {
      setQuestionsResult("❌ 질문 제목을 입력해주세요.");
      return;
    }

    setQuestionsLoading(true);
    setQuestionsResult("");

    try {
      const nextOrder =
        questions.length > 0
          ? Math.max(...questions.map((q) => q.order)) + 1
          : 1;
      await createQuestion({
        title: newQuestion.title.trim(),
        subtitle: newQuestion.subtitle.trim() || undefined,
        type: newQuestion.type,
        required: newQuestion.required,
        order: nextOrder,
      });
      setQuestionsResult(
        `✅ Successfully created question: ${newQuestion.title}`
      );
      setNewQuestion({
        title: "",
        subtitle: "",
        type: "text",
        required: true,
      });
      await loadQuestions();
    } catch (error: any) {
      setQuestionsResult(`❌ Error creating question: ${error.message}`);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Menu functions
  const handleAddMenuItem = async () => {
    if (!newItemName.trim()) return;

    setMenuLoading(true);
    setMenuResult("");

    try {
      await createMenuItem(newItemName.trim());
      setMenuResult(`✅ Successfully created menu item: ${newItemName}`);
      setNewItemName("");
      await loadMenuItems();
    } catch (error: any) {
      setMenuResult(`❌ Error: ${error.message}`);
    } finally {
      setMenuLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      const items = await getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error("Failed to load menu items:", error);
    }
  };

  const handleLoadMenuItems = async () => {
    setMenuLoading(true);
    await loadMenuItems();
    setMenuLoading(false);
  };

  const handleDeleteMenuItem = async (menuItem: MenuItem) => {
    if (!confirm(`정말로 "${menuItem.name}" 메뉴를 삭제하시겠습니까?`)) {
      return;
    }

    setMenuLoading(true);
    setMenuResult("");

    try {
      await deleteMenuItem(menuItem.id);
      setMenuResult(`✅ Successfully deleted menu item: ${menuItem.name}`);
      await loadMenuItems();
    } catch (error: any) {
      setMenuResult(`❌ Error deleting menu item: ${error.message}`);
    } finally {
      setMenuLoading(false);
    }
  };

  // Approval functions
  const loadPendingRegistrations = async () => {
    try {
      const currentEvent = await getCurrentEvent();
      if (!currentEvent) {
        setApprovalsResult("❌ 현재 활성화된 이벤트가 없습니다.");
        return;
      }

      setCurrentEventId(currentEvent.id);
      const pending = await getPendingRegistrations(currentEvent.id);
      setPendingRegistrations(pending);

      // Calculate event statistics
      await calculateEventStats(currentEvent.id, currentEvent);
    } catch (error: any) {
      console.error("Failed to load pending registrations:", error);
      setApprovalsResult(
        `❌ Error loading pending registrations: ${error.message}`
      );
    }
  };

  const calculateEventStats = async (eventId: string, event: any) => {
    try {
      const { getAllRegistrationsByStatus } = await import("@/lib/firestore");

      // Get approved and pending registrations
      const approvedRegistrations = await getAllRegistrationsByStatus(
        eventId,
        "approved"
      );
      const pendingRegistrations = await getAllRegistrationsByStatus(
        eventId,
        "pending"
      );

      // Count by gender
      let approvedMale = 0,
        approvedFemale = 0;
      let pendingMale = 0,
        pendingFemale = 0;

      approvedRegistrations.forEach((reg: any) => {
        if (reg.user.gender === "male") approvedMale++;
        else if (reg.user.gender === "female") approvedFemale++;
      });

      pendingRegistrations.forEach((reg: any) => {
        if (reg.user.gender === "male") pendingMale++;
        else if (reg.user.gender === "female") pendingFemale++;
      });

      setEventStats({
        approvedMale,
        approvedFemale,
        pendingMale,
        pendingFemale,
        maxMale: event.maxMaleSlots || 5,
        maxFemale: event.maxFemaleSlots || 5,
      });
    } catch (error) {
      console.error("Error calculating event stats:", error);
    }
  };

  const handleLoadApprovals = async () => {
    setApprovalsLoading(true);
    setApprovalsResult("");
    await loadPendingRegistrations();
    setApprovalsLoading(false);
  };

  const handleApproveRegistration = async (
    registrationId: string,
    userName: string
  ) => {
    if (!confirm(`${userName}님의 신청을 승인하시겠습니까?`)) {
      return;
    }

    setApprovalsLoading(true);
    setApprovalsResult("");

    try {
      await approveRegistration(registrationId);
      setApprovalsResult(`✅ ${userName}님의 신청이 승인되었습니다!`);
      await loadPendingRegistrations(); // Refresh the list and stats
    } catch (error: any) {
      setApprovalsResult(`❌ Error approving registration: ${error.message}`);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const handleRejectRegistration = async (
    registrationId: string,
    userName: string
  ) => {
    if (!confirm(`${userName}님의 신청을 거부하시겠습니까?`)) {
      return;
    }

    setApprovalsLoading(true);
    setApprovalsResult("");

    try {
      await rejectRegistration(registrationId);
      setApprovalsResult(`❌ ${userName}님의 신청이 거부되었습니다.`);
      await loadPendingRegistrations(); // Refresh the list and stats
    } catch (error: any) {
      setApprovalsResult(`❌ Error rejecting registration: ${error.message}`);
    } finally {
      setApprovalsLoading(false);
    }
  };

  // Reports function
  const generateReport = async () => {
    if (!currentEventId) {
      setReportsResult("현재 이벤트를 먼저 불러와주세요!");
      return;
    }

    setReportsLoading(true);
    setReportsResult("");

    try {
      // Get current event
      const currentEvent = await getCurrentEvent();
      if (!currentEvent) {
        throw new Error("현재 이벤트를 찾을 수 없습니다.");
      }

      // Get approved participants
      const approvedRegistrations = await getAllRegistrationsByStatus(
        currentEventId,
        "approved"
      );

      // Get all questionnaire answers for the event
      const allAnswers = await getAllQuestionnaireAnswers(currentEventId);

      // Combine participant data with their answers
      const participantsWithAnswers = approvedRegistrations.map((reg) => {
        const userAnswers = allAnswers.find(
          (answer) => answer.userId === reg.user.id
        );
        return {
          user: reg.user,
          answers: userAnswers?.answers || [],
        };
      });

      await generateFullReport(
        participantsWithAnswers,
        currentEvent.title,
        currentEvent.date.toLocaleDateString?.() ||
          currentEvent.date.toString(),
        eventStats || undefined
      );

      setReportsResult("✅ 전체 리포트가 성공적으로 생성되었습니다!");
    } catch (error: any) {
      setReportsResult(`리포트 생성 실패: ${error.message}`);
    } finally {
      setReportsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>관리자 페이지</CardTitle>
            <p className="text-sm text-gray-600">
              참석자, 질문지, 그리고 메뉴를 관리할 수 있습니다.
            </p>
            <p className="text-sm text-red-500">
              주의: 손님들한테 링크가 나간 후엔 정보 수정 금지!
            </p>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 mb-6">
              <button
                onClick={() => setActiveTab("approvals")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === "approvals"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                참석자 관리
              </button>
              <button
                onClick={() => setActiveTab("questions")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === "questions"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                질문지 관리
              </button>
              <button
                onClick={() => setActiveTab("menu")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === "menu"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                메뉴 관리
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === "reports"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                PDF 리포트
              </button>
            </div>

            {/* Approvals Tab */}
            {activeTab === "approvals" && (
              <div className="space-y-6">
                {/* Load Approvals */}
                <div className="space-y-3">
                  <h3 className="font-medium">대기 중인 신청 불러오기</h3>
                  <Button
                    onClick={handleLoadApprovals}
                    disabled={approvalsLoading}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {approvalsLoading
                      ? "불러오는 중..."
                      : "대기 중인 신청 불러오기"}
                  </Button>
                  {approvalsResult && (
                    <div className="p-3 bg-gray-100 rounded-md">
                      <p className="text-sm font-mono whitespace-pre-wrap">
                        {approvalsResult}
                      </p>
                    </div>
                  )}
                </div>

                {/* Event Statistics */}
                {eventStats && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-800 text-lg">
                        📊 참가자 현황
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Male Stats */}
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            👨 남성
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>승인됨:</span>
                              <span className="font-mono font-bold text-green-600">
                                {eventStats.approvedMale}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>대기중:</span>
                              <span className="font-mono font-bold text-yellow-600">
                                {eventStats.pendingMale}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>총계:</span>
                              <span className="font-mono font-bold">
                                {eventStats.approvedMale +
                                  eventStats.pendingMale}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>한도:</span>
                              <span className="font-mono font-bold text-blue-600">
                                {eventStats.maxMale}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>여유:</span>
                              <span
                                className={`font-mono font-bold ${
                                  eventStats.maxMale -
                                    eventStats.approvedMale -
                                    eventStats.pendingMale <=
                                  0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {eventStats.maxMale -
                                  eventStats.approvedMale -
                                  eventStats.pendingMale}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Female Stats */}
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            👩 여성
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>승인됨:</span>
                              <span className="font-mono font-bold text-green-600">
                                {eventStats.approvedFemale}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>대기중:</span>
                              <span className="font-mono font-bold text-yellow-600">
                                {eventStats.pendingFemale}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>총계:</span>
                              <span className="font-mono font-bold">
                                {eventStats.approvedFemale +
                                  eventStats.pendingFemale}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>한도:</span>
                              <span className="font-mono font-bold text-blue-600">
                                {eventStats.maxFemale}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>여유:</span>
                              <span
                                className={`font-mono font-bold ${
                                  eventStats.maxFemale -
                                    eventStats.approvedFemale -
                                    eventStats.pendingFemale <=
                                  0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {eventStats.maxFemale -
                                  eventStats.approvedFemale -
                                  eventStats.pendingFemale}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Warning Messages */}
                      {(eventStats.approvedMale + eventStats.pendingMale >
                        eventStats.maxMale ||
                        eventStats.approvedFemale + eventStats.pendingFemale >
                          eventStats.maxFemale) && (
                        <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                          <p className="text-red-800 text-sm font-medium">
                            ⚠️ 경고: 일부 성별에서 신청자가 한도를 초과했습니다!
                          </p>
                          <p className="text-red-600 text-xs mt-1">
                            승인 시 한도 초과에 주의하세요.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Pending Registrations List */}
                {pendingRegistrations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium">
                      승인 대기 목록 ({pendingRegistrations.length}건)
                    </h3>
                    <div className="space-y-3">
                      {pendingRegistrations.map(
                        (registration: any, index: number) => (
                          <Card
                            key={registration.id}
                            className="border-l-4 border-l-yellow-400"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    {registration.user.name}
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                      (
                                      {registration.user.gender === "male"
                                        ? "남성"
                                        : "여성"}
                                      , {registration.user.age}세)
                                    </span>
                                  </CardTitle>
                                  <div className="text-sm text-gray-600 space-y-1">
                                    <p>{registration.user.phoneNumber}</p>
                                    <p>
                                      {registration.submittedAt
                                        ?.toDate?.()
                                        ?.toLocaleString("ko-KR") ||
                                        "정보 없음"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      대기 순서: {index + 1}번째
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() =>
                                      handleApproveRegistration(
                                        registration.registrationId,
                                        registration.user.name
                                      )
                                    }
                                    disabled={approvalsLoading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    승인
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleRejectRegistration(
                                        registration.registrationId,
                                        registration.user.name
                                      )
                                    }
                                    disabled={approvalsLoading}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    size="sm"
                                  >
                                    거부
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}

                {pendingRegistrations.length === 0 && currentEventId && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">모든 신청이 처리되었습니다!</p>
                  </div>
                )}
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === "questions" && (
              <div className="space-y-6">
                {/* Add Single Question */}
                <div className="space-y-3">
                  <h3 className="font-medium">질문 추가하기</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="questionSubtitle" className="pb-2">
                        질문 제목 [이거 안에 들어가는거]
                      </Label>
                      <Input
                        id="questionSubtitle"
                        type="text"
                        placeholder="예: 연애 스타일"
                        value={newQuestion.subtitle}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            subtitle: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="questionTitle" className="pb-2">
                        질문 내용
                      </Label>
                      <Textarea
                        id="questionTitle"
                        placeholder="예: 이상형은 어떤 사람인가요?"
                        value={newQuestion.title}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        rows={2}
                        className="bg-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="questionRequired"
                        type="checkbox"
                        checked={newQuestion.required}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            required: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="questionRequired">필수 질문 여부</Label>
                    </div>

                    <Button
                      onClick={handleCreateQuestion}
                      disabled={questionsLoading || !newQuestion.title.trim()}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      {questionsLoading ? "저장 중..." : "추가하기"}
                    </Button>
                  </div>
                </div>

                {/* View Current Questions */}
                <div className="space-y-3">
                  <h3 className="font-medium">현재 설정된 질문 조회</h3>
                  <Button
                    onClick={handleLoadQuestions}
                    disabled={questionsLoading}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {questionsLoading ? "조회 중..." : "조회하기"}
                  </Button>

                  {questions.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <p className="text-sm text-gray-600">
                        총 {questions.length}개 질문이 등록되어 있습니다.
                      </p>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {questions.map((question) => (
                          <div
                            key={question.id}
                            className="bg-white rounded p-4 border border-gray-200"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                                      {question.order}
                                    </span>
                                    {question.subtitle && (
                                      <span className="text-xs text-purple-600 font-medium">
                                        {question.subtitle}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {question.title}
                                  </p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span>Type: {question.type}</span>
                                    {question.required && (
                                      <span className="text-red-500">
                                        • Required
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleDeleteQuestion(question)}
                                  disabled={questionsLoading}
                                  className="ml-4 bg-black text-white hover:bg-gray-800"
                                  size="sm"
                                >
                                  삭제
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Result */}
                {questionsResult && (
                  <div
                    className={`p-4 rounded-md text-sm ${
                      questionsResult.startsWith("✅")
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {questionsResult}
                  </div>
                )}
              </div>
            )}

            {/* Menu Tab */}
            {activeTab === "menu" && (
              <div className="space-y-6">
                {/* Add Single Item */}
                <div className="space-y-3">
                  <h3 className="font-medium">메뉴 추가</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="pb-2" htmlFor="itemName">
                        이름
                      </Label>
                      <Input
                        id="itemName"
                        type="text"
                        placeholder="예: 마크리 무어"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAddMenuItem}
                      disabled={menuLoading || !newItemName.trim()}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      {menuLoading ? "추가 중..." : "추가하기"}
                    </Button>
                  </div>
                </div>

                {/* View Current Menu */}
                <div className="space-y-3">
                  <h3 className="font-medium">현재 설정된 메뉴 조회</h3>
                  <Button
                    onClick={handleLoadMenuItems}
                    disabled={menuLoading}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {menuLoading ? "Loading..." : "조회하기"}
                  </Button>

                  {menuItems.length > 0 && (
                    <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-md">
                      {menuItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded p-3 flex justify-between items-center border"
                        >
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                          <Button
                            onClick={() => handleDeleteMenuItem(item)}
                            disabled={menuLoading}
                            className="bg-black text-white hover:bg-gray-800"
                            size="sm"
                          >
                            삭제
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Result */}
                {menuResult && (
                  <div
                    className={`p-4 rounded-md text-sm ${
                      menuResult.startsWith("✅")
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {menuResult}
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <div className="space-y-6">
                {/* Reports Header */}
                <div className="space-y-3">
                  <h3 className="font-medium">PDF 리포트 생성</h3>
                  <p className="text-sm text-gray-600">
                    참가자 정보 및 답변을 PDF로 다운로드할 수 있습니다.
                  </p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      💡 리포트 생성 전, '참석자 관리' 탭에서 현재 이벤트를 먼저
                      불러와주세요.
                    </p>
                  </div>
                </div>

                {/* Report Generation */}
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-800 text-lg">
                      전체 리포트
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      참가자 정보, 질문지 답변, 통계 포함
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={generateReport}
                      disabled={reportsLoading || !currentEventId}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {reportsLoading ? "생성 중..." : "전체 리포트 다운로드"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Result */}
                {reportsResult && (
                  <div
                    className={`p-4 rounded-md text-sm ${
                      reportsResult.startsWith("✅")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {reportsResult}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
