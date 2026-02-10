import { User } from "@/types";

// Interface for participant with questionnaire answers
interface ParticipantWithAnswers {
  user: User;
  answers: Array<{
    questionId: string;
    order: number;
    title: string;
    subtitle?: string;
    answer: string;
  }>;
}

// Interface for event statistics
interface EventStats {
  approvedMale: number;
  approvedFemale: number;
  pendingMale: number;
  pendingFemale: number;
  maxMale: number;
  maxFemale: number;
}

// Generate HTML content with proper Korean font support
const generateReportHTML = (
  participants: ParticipantWithAnswers[],
  eventTitle: string,
  eventDate: string,
  stats?: EventStats
): string => {
  const statsTable = stats
    ? `
    <div class="section">
      <h2>참가자 현황</h2>
      <table class="stats-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>승인됨</th>
            <th>대기중</th>
            <th>총합</th>
            <th>한도</th>
            <th>여유</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>남성</td>
            <td>${stats.approvedMale}</td>
            <td>${stats.pendingMale}</td>
            <td>${stats.approvedMale + stats.pendingMale}</td>
            <td>${stats.maxMale}</td>
            <td>${stats.maxMale - stats.approvedMale - stats.pendingMale}</td>
          </tr>
          <tr>
            <td>여성</td>
            <td>${stats.approvedFemale}</td>
            <td>${stats.pendingFemale}</td>
            <td>${stats.approvedFemale + stats.pendingFemale}</td>
            <td>${stats.maxFemale}</td>
            <td>${
              stats.maxFemale - stats.approvedFemale - stats.pendingFemale
            }</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
    : "";

  const participantsTable = `
    <div class="section">
      <h2>참가자 목록 (총 ${participants.length}명)</h2>
      <table class="participants-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>이름</th>
            <th>성별</th>
            <th>나이</th>
            <th>전화번호</th>
          </tr>
        </thead>
        <tbody>
          ${participants
            .map(
              (participant, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${participant.user.name}</td>
              <td>${participant.user.gender === "male" ? "남성" : "여성"}</td>
              <td>${participant.user.age}</td>
              <td>${participant.user.phoneNumber || "N/A"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  const questionnaireSection =
    participants.length > 0 && participants[0].answers.length > 0
      ? `
    <div class="section questionnaire">
      <h2>질문지 응답</h2>
      ${participants
        .map(
          (participant, participantIndex) => `
        <div class="participant-responses">
          <h3>${participantIndex + 1}. ${participant.user.name} (${
            participant.user.gender === "male" ? "남성" : "여성"
          }, ${participant.user.age}세)</h3>
          <div class="answers">
            ${participant.answers
              .map(
                (answer) => `
              <div class="qa-pair">
                <div class="question">
                  <strong>Q${answer.order}. ${
                  answer.subtitle ? `[${answer.subtitle}] ` : ""
                }${answer.title}</strong>
                </div>
                <div class="answer">
                  A: ${answer.answer || "답변 없음"}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>꺄르륵 파티 참가자 리포트</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');

        body {
          font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #8B4513;
          padding-bottom: 20px;
        }

        .header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #8B4513;
        }

        .header-info {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }

        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        h2 {
          font-size: 18px;
          font-weight: 700;
          color: #8B4513;
          margin-bottom: 15px;
          border-left: 4px solid #8B4513;
          padding-left: 10px;
        }

        h3 {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 10px;
          color: #444;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 12px;
        }

        th {
          background-color: #8B4513;
          color: white;
          font-weight: 500;
        }

        tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .participant-responses {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }

        .qa-pair {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }

        .question {
          font-size: 13px;
          margin-bottom: 5px;
          color: #444;
        }

        .answer {
          font-size: 12px;
          color: #666;
          padding-left: 15px;
          border-left: 3px solid #8B4513;
          margin-left: 10px;
        }

        /* Mobile responsive styles */
        @media screen and (max-width: 768px) {
          body {
            margin: 10px;
            font-size: 14px;
          }

          .header h1 {
            font-size: 20px;
          }

          table {
            font-size: 11px;
          }

          th, td {
            padding: 6px 4px;
          }

          .qa-pair {
            padding: 8px;
          }
        }

        @media print {
          body {
            margin: 0;
            font-size: 12px;
          }

          .section {
            page-break-inside: avoid;
          }

          .participant-responses {
            page-break-inside: avoid;
          }

          .print-instructions {
            display: none;
          }
        }

        .print-instructions {
          background-color: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
        }

        .print-instructions h3 {
          color: #1976d2;
          margin: 0 0 10px 0;
          font-size: 16px;
        }

        .print-instructions p {
          margin: 5px 0;
          font-size: 13px;
          color: #424242;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>꺄르륵 파티 참가자 리포트</h1>
        <div class="header-info">생성일시: ${new Date().toLocaleString(
          "ko-KR"
        )}</div>
      </div>

      ${statsTable}
      ${participantsTable}
      ${questionnaireSection}
    </body>
    </html>
  `;
};

// Generate and download HTML file (mobile-friendly approach)
export const generateFullReport = async (
  participants: ParticipantWithAnswers[],
  eventTitle: string,
  eventDate: string,
  stats?: EventStats
): Promise<void> => {
  try {
    // Generate HTML content
    const htmlContent = generateReportHTML(
      participants,
      eventTitle,
      eventDate,
      stats
    );

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kyareureuk-party-report-${new Date().toISOString().split('T')[0]}.html`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('리포트 생성에 실패했습니다.');
  }
};
