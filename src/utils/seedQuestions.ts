import { createQuestion } from '@/lib/firestore';
import { Question } from '@/types';

const sampleQuestions: Omit<Question, "id">[] = [
  {
    type: "text",
    title: "내가 제일 좋아하는 음식은?",
    subtitle: "[이거 사주면 나랑 사귀는 거다?!]",
    required: true,
    order: 1
  },
  {
    type: "text",
    title: "좋아하는 사람한테 제일 듣고 싶은 말은?",
    subtitle: "[이 말 들으면 호감도 급상승!]",
    required: true,
    order: 2
  },
  {
    type: "text",
    title: "내가 제일 좋아하는 가수/밴드는?",
    subtitle: "[너도 혹시..?]",
    required: true,
    order: 3
  },
  {
    type: "text",
    title: "좋아하는 사람과 하고 싶은 나의 취미는?",
    subtitle: "[나랑 놀러 가자!!]",
    required: true,
    order: 4
  },
  {
    type: "text",
    title: "호감 있어도 단번에 식는 행동 or 말투는?",
    subtitle: "[이것만은 하지 말아줘…]",
    required: true,
    order: 5
  },
  {
    type: "text",
    title: "아무도 모르지만, 나 사실 이런 행동에 은근히 꽂힌다!",
    subtitle: "[이런 이성이 마음에 든다!]",
    required: true,
    order: 6
  },
  {
    type: "text",
    title: "나를 설레게 만드는 한마디 or 행동은?",
    subtitle: "[심쿵주의보 발령!]",
    required: true,
    order: 7
  },
  {
    type: "text",
    title: "내가 술 마시면 은근히 나오는 '썸'스러운 행동은?",
    subtitle: "[술 들어가면 나 이렇게 돼요]",
    required: true,
    order: 8
  },
  {
    type: "text",
    title: "첫인상에서 가장 끌리는 포인트는? (외모/목소리/말투/행동 등)",
    subtitle: "[첫눈에 반한 포인트는?]",
    required: true,
    order: 9
  },
  {
    type: "text",
    title: "나를 공략하려면 이것만은 피해라!",
    subtitle: "[이건 진짜 비호감…]",
    required: true,
    order: 10
  }
];

export const seedQuestions = async () => {
  console.log('💕 Starting to seed questionnaire questions...');

  const results = [];

  for (const questionData of sampleQuestions) {
    try {
      const questionId = await createQuestion(questionData);
      results.push({ id: questionId, ...questionData });
      console.log(`✅ Created question ${questionData.order}: ${questionData.title}`);
    } catch (error) {
      console.error(`❌ Failed to create question ${questionData.order}:`, error);
    }
  }

  console.log(`🎉 Question seeding completed: ${results.length}/${sampleQuestions.length} questions created`);
  return results;
};