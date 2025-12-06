'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { seedQuestions } from '@/utils/seedQuestions';
import { getQuestions } from '@/lib/firestore';
import { Question } from '@/types';

export default function QuestionsAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleSeedQuestions = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const results = await seedQuestions();
      setResult(`✅ Successfully created ${results.length} questions!`);
      await loadQuestions();
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const questionData = await getQuestions();
      setQuestions(questionData);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleLoadQuestions = async () => {
    setIsLoading(true);
    await loadQuestions();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>💕 Questionnaire Management</CardTitle>
            <p className="text-sm text-gray-600">
              Manage questionnaire questions for the dating event
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seed Questions */}
            <div className="space-y-3">
              <h3 className="font-medium">Seed Questionnaire Questions</h3>
              <p className="text-sm text-gray-600">
                Add 10 pre-designed dating questionnaire questions
              </p>
              <Button
                onClick={handleSeedQuestions}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Seed Questions (10 questions)'}
              </Button>
            </div>

            <div className="border-t pt-6" />

            {/* View Current Questions */}
            <div className="space-y-3">
              <h3 className="font-medium">Current Questions</h3>
              <Button
                onClick={handleLoadQuestions}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Loading...' : 'Load Current Questions'}
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
                        <div className="space-y-2">
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
                              <span className="text-red-500">• Required</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className={`p-4 rounded-md text-sm ${
                result.startsWith('✅')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {result}
              </div>
            )}

            {/* Info */}
            <div className="bg-purple-50 p-4 rounded-md text-sm text-purple-700">
              <p className="font-medium mb-2">💕 About the Questions:</p>
              <ul className="space-y-1 text-xs">
                <li>• 10개의 재미있고 썸타는 질문들</li>
                <li>• 상대방이 답변을 보고 관심을 표현할 수 있어요</li>
                <li>• 12월 6일 토요일 오후 8시까지 답변 필요</li>
                <li>• 모든 질문이 필수 답변입니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}