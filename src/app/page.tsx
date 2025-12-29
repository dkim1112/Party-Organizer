"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function Home() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use Firebase environment-based password verification
      const { verifyBarPassword } = await import("@/lib/firestore");

      if (verifyBarPassword(password)) {
        router.push("/status");
      } else {
        setError("비밀번호가 올바르지 않아요.");
      }
    } catch (err) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="꺄르륵 파티">
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">환영합니다!</h2>
          <p className="text-gray-600">
            꺄르륵 파티에 참가하시려면
            <br />
            [연림] 전용 비밀번호를 입력 해주세요.
          </p>
        </div>

        {/* Password Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>인증 절차</CardTitle>
            <CardDescription>
              참가자 전원을 [연림] 손님/지인으로만 받아요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비번은 [연림]에서 확인이 가능해요."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : "확인"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="text-center text-sm text-gray-500">
          <p>🍻 &quot;오늘이 지나면 우리 사이, 달라질 거야&quot; 🍻</p>
          <p className="mt-1">문의사항: DM - yeonrim_bar</p>
        </div>
      </div>
    </AppLayout>
  );
}
