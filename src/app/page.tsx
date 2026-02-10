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

type Step = "password" | "menu";

export default function Home() {
  const [step, setStep] = useState<Step>("password");
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
        setStep("menu");
      } else {
        setError("비밀번호가 올바르지 않아요.");
      }
    } catch (err) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    // Store intent to sign up
    sessionStorage.setItem("userIntent", "signup");
    router.push("/status");
  };

  const handleLogin = () => {
    // Store intent to login
    sessionStorage.setItem("userIntent", "login");
    router.push("/auth");
  };

  const handleGoBack = () => {
    setStep("password");
    setPassword("");
    setError("");
  };

  return (
    <AppLayout
      title="꺄르륵 파티"
      showBackButton={step === "menu"}
      onBack={handleGoBack}
    >
      <div className="space-y-6">
        {step === "password" && (
          <>
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
          </>
        )}

        {step === "menu" && (
          <>
            {/* Welcome Message for Verified Users */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                회원가입 / 로그인
              </h2>
              <p className="text-gray-600">
                처음 방문이시거나 이미 신청하신 회원이신가요?
              </p>
            </div>

            {/* New User Sign Up */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center space-x-2">
                  <span>처음 참가해요</span>
                </CardTitle>
                <CardDescription className="text-green-700">
                  회원가입 후 참가 신청을 해주세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleSignUp}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  회원가입 하러 가기
                </Button>
              </CardContent>
            </Card>

            {/* Existing User Login */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center space-x-2">
                  <span>이미 신청 했어요</span>
                </CardTitle>
                <CardDescription className="text-blue-700">
                  바로 로그인하여 대시보드로 이동하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  로그인하기
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Info */}
        <div className="text-center text-sm text-gray-500">
          <p>🍻 &quot;오늘이 지나면 우리 사이, 달라질 거야&quot; 🍻</p>
          <p className="mt-1">문의사항: DM - yeonrim_bar</p>
        </div>
      </div>
    </AppLayout>
  );
}
