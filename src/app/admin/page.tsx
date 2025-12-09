"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMenuItem, getMenuItems, deleteMenuItem } from "@/lib/firestore";
import { getQuestions, deleteQuestion, createQuestion } from "@/lib/firestore";
import { MenuItem, Question } from "@/types";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"questions" | "menu">("questions");

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>관리자 페이지</CardTitle>
            <p className="text-sm text-gray-600">
              질문지와 메뉴를 관리할 수 있습니다.
            </p>
            <p className="text-sm text-red-500">
              주의: 손님들한테 링크가 나간 후엔 정보 수정 금지!
            </p>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 mb-6">
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
            </div>

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
                      variant="outline"
                      className="w-full"
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
                    variant="outline"
                    className="w-full"
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
                                  variant="destructive"
                                  size="sm"
                                  className="ml-4"
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
                      variant="outline"
                      className="w-full"
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
                    variant="outline"
                    className="w-full"
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
                            variant="destructive"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
