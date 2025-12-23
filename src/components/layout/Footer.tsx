export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700 mb-2">사업자 정보</p>
          <p>
            <span className="text-gray-600">상호명:</span> 연림
          </p>
          <p>
            <span className="text-gray-600">대표자:</span> 이중후
          </p>
          <p>
            <span className="text-gray-600">사업자등록번호:</span> 405-03-96769
          </p>
          <p>
            <span className="text-gray-600">주소:</span> 서울특별시 관악구
            행운1길 56 지하1층 연림
          </p>
          <p>
            <span className="text-gray-600">전화번호:</span> 010-4013-5771
          </p>
          <div className="border-t border-gray-200 mt-3 pt-3">
            <p className="text-gray-400">
              Copyright 2025. 연림. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
