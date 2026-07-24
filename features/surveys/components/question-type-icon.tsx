import { AlignLeft, CheckSquare, CircleDot, Gauge, Star, ToggleLeft, TrendingUp, type LucideIcon } from "lucide-react";

import type { QuestionType } from "../schema";

export const QUESTION_TYPE_ICONS: Record<QuestionType, LucideIcon> = {
  rating_5: Star,
  rating_10: Gauge,
  nps: TrendingUp,
  single_choice: CircleDot,
  multiple_choice: CheckSquare,
  open_text: AlignLeft,
  yes_no: ToggleLeft,
};
