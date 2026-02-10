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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  getQuestions,
  getQuestionnaireAnswers,
  saveQuestionnaireAnswers,
  getCurrentEvent,
  getUserByKakaoId,
} from "@/lib/firestore";
import { Question, QuestionnaireAnswers } from "@/types";

export default function QuestionnairePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      // Route protection: Check if user has proper access
      const urlParams = new URLSearchParams(window.location.search);
      const isViewMode = urlParams.get("view") === "true";

      if (!isViewMode) {
        // Normal questionnaire access - check for payment/approval data
        const paymentResultData = sessionStorage.getItem("paymentResult");
        const pendingUserData = sessionStorage.getItem("pendingUser");

        if (!paymentResultData && !pendingUserData) {
          // No valid session data, redirect to home
          router.push("/");
          return;
        }
      }

      checkViewMode();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await loadQuestions();
    };

    initializePage();
  }, [router]);

  const checkViewMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewMode = urlParams.get("view") === "true";
    const userId = urlParams.get("userId");
    const eventId = urlParams.get("eventId");

    if (viewMode && userId && eventId) {
      setIsViewMode(true);
      setCurrentUserId(userId);
      setCurrentEventId(eventId);
    }
  };

  const loadQuestions = async () => {
    try {
      const questionsData = await getQuestions();

      if (questionsData.length === 0) {
        setError("질문지가 아직 준비되지 않았습니다.");
      } else {
        setQuestions(questionsData);

        // Check for view mode parameters from URL directly
        const urlParams = new URLSearchParams(window.location.search);
        const isViewModeParam = urlParams.get("view") === "true";
        const userIdParam = urlParams.get("userId");
        const eventIdParam = urlParams.get("eventId");

        // If in view mode, load existing answers
        if (isViewModeParam && userIdParam && eventIdParam) {
          const existingAnswers = await getQuestionnaireAnswers(
            userIdParam,
            eventIdParam
          );

          if (existingAnswers) {
            setAnswers(existingAnswers);
          } else {
            setError("저장된 답변을 찾을 수 없습니다.");
          }
        }
      }
    } catch (error) {
      setError("질문지를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const validateAnswers = (): boolean => {
    for (const question of questions) {
      const answer = answers[question.id];
      const hasValidAnswer = typeof answer === "string" && answer.trim();

      if (question.required && !hasValidAnswer) {
        setError(`질문 ${question.order}번에 답변해주세요.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");

    if (!validateAnswers()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user and event info
      const paymentResultData = sessionStorage.getItem("paymentResult");
      const pendingUserData = sessionStorage.getItem("pendingUser");

      let userData = null;
      if (paymentResultData) {
        const paymentResult = JSON.parse(paymentResultData);
        userData = paymentResult.userData;
      } else if (pendingUserData) {
        userData = JSON.parse(pendingUserData);
      }

      if (!userData || !userData.kakaoId) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      // Get user from database
      const user = await getUserByKakaoId(userData.kakaoId);
      if (!user) {
        throw new Error("데이터베이스에서 사용자를 찾을 수 없습니다.");
      }

      // Get current event
      const currentEvent = await getCurrentEvent();
      if (!currentEvent) {
        throw new Error("활성 이벤트를 찾을 수 없습니다.");
      }

      // Save answers to database
      await saveQuestionnaireAnswers(user.id, currentEvent.id, answers);

      // Also save to sessionStorage for backup
      sessionStorage.setItem("questionnaireAnswers", JSON.stringify(answers));

      alert("질문지 작성 완료! 감사합니다 💕");
      router.push("/dashboard");
    } catch (error: any) {
      setError(`답변 저장에 실패했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const requiredQuestions = questions.filter(q => q.required);
  const answeredRequiredCount = Object.keys(answers).filter((key) => {
    const answer = answers[key];
    const question = questions.find(q => q.id === key);
    return question?.required && typeof answer === "string" && answer.trim();
  }).length;
  const progressPercentage =
    requiredQuestions.length > 0 ? (answeredRequiredCount / requiredQuestions.length) * 100 : 0;

  if (isLoading) {
    return (
      <AppLayout title="질문지 작성" showBackButton onBack={handleGoBack}>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="질문지를 불러오는 중..." />
        </div>
      </AppLayout>
    );
  }

  if (error && questions.length === 0) {
    return (
      <AppLayout title="질문지 작성" showBackButton onBack={handleGoBack}>
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={loadQuestions} variant="outline">
            다시 시도
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isViewMode ? "💕 내 답변 보기" : "💕 사전 질문지"}
      showBackButton
      onBack={handleGoBack}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-purple-800">
            {isViewMode ? "내가 작성한 설문" : "사전 질문지 작성"}
          </h2>
          {isViewMode ? (
            <p className="text-sm text-gray-600">
              답변 변경 희망시 개별적으로 연락 주세요.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">간단하게 적어도 괜찮아요.</p>
              <p className="text-xs text-red-600 font-medium">
                ⏰ 중간에 나가게 되면 작성 내용이 저장되지 않으니 주의 해주세요!
              </p>
            </>
          )}
        </div>

        {/* Progress */}
        {!isViewMode ? (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>작성 진행률 (필수 질문)</span>
                  <span>
                    {answeredRequiredCount}/{requiredQuestions.length}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question) => (
            <Card key={question.id} className="border-l-4 border-l-purple-400">
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-800">
                      {question.order}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    {question.subtitle && (
                      <CardDescription className="text-purple-600 font-medium text-xs">
                        {question.subtitle}
                      </CardDescription>
                    )}
                    <CardTitle className="text-base leading-tight">
                      {question.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Label
                    htmlFor={`question-${question.id}`}
                    className="sr-only"
                  >
                    질문 {question.order} 답변
                  </Label>
                  <Textarea
                    id={`question-${question.id}`}
                    placeholder={isViewMode ? "" : "솔직하게 답변 해주세요 😊"}
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      !isViewMode &&
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className={`min-h-[80px] resize-none ${
                      isViewMode ? "bg-gray-50 cursor-default" : ""
                    }`}
                    rows={3}
                    readOnly={isViewMode}
                  />
                  <div className="text-xs text-gray-500">
                    {answers[question.id]?.length || 0}/100자
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Submit */}
        {!isViewMode && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent>
                <div className="text-center space-y-3">
                  <p className="text-sm text-green-800">
                    모든 필수 질문에 답변하면 제출할 수 있어요!
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || answeredRequiredCount < requiredQuestions.length}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      `질문지 제출하기 (필수 ${answeredRequiredCount}/${requiredQuestions.length})`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>🔒 전체 답변은 관심있는 상대방만 볼 수 있어요.</p>
        </div>
      </div>
    </AppLayout>
  );
}
