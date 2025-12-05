

export enum AppMode {
  HOME = 'HOME',
  TEACHER = 'TEACHER',
  KID = 'KID'
}

export enum TeacherTool {
  MENU = 'MENU',
  STORY_CREATOR = 'STORY_CREATOR',
  LESSON_PLANNER = 'LESSON_PLANNER',
  FLASHCARD_MAKER = 'FLASHCARD_MAKER'
}

export enum KidActivity {
  MENU = 'MENU',
  STORY_TIME = 'STORY_TIME',
  GAME_QUIZ = 'GAME_QUIZ'
}

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioBase64?: string;
}

export interface Story {
  id: string;
  title: string;
  pages: StoryPage[];
}

export interface ExternalStory {
  id: string;
  title: string;
  url: string;
  color?: string;
  isFromSheet?: boolean; // New flag to identify sheet items
}

export interface ExternalGame {
  id: string;
  title: string;
  url: string;
  color?: string;
  isFromSheet?: boolean; // New flag
}

export interface Flashcard {
  word: string;
  englishWord?: string;
  visualDescription?: string; // Detailed prompt for image gen
  imageUrl?: string;
}

export interface FlashcardSet {
  id: string;
  topic: string;
  cards: Flashcard[];
  createdAt: number;
}

export interface LessonPlan {
  topic: string;
  content: string; // Markdown content
}

export interface QuizQuestion {
  question: string;
  options: {
    id: string;
    text: string;
    imageUrl?: string; // Optional image for "Pick the right image"
    imagePrompt?: string;
  }[];
  correctOptionId: string;
}
