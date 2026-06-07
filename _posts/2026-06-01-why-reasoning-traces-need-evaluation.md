---
title: "Why Reasoning Traces Need Evaluation"
category: research
date: 2026-06-01
tldr: "추론 과정을 보여주는 모델을 평가할 때 결과 정확도만으로 부족한 이유를 정리합니다."
keywords: [evaluation, reasoning, llm]
secret: false
---

추론 과정을 출력하는 모델은 정답뿐 아니라 중간 설명도 사용자에게 노출합니다.
따라서 평가는 결과 정확도, 설명의 일관성, 사용자가 실제로 검증할 수 있는 근거를 함께 보아야 합니다.

## Evaluation Sketch

첫 번째 단계는 태스크별 성공 기준을 분리하는 것입니다. 예를 들어 수학 문제에서는 정답과 풀이의 논리적 연결을,
문서 질의응답에서는 인용된 근거와 답변의 대응 관계를 별도로 측정할 수 있습니다.

> A useful trace should make verification cheaper, not merely make the answer longer.

## Minimal Checklist

- 정답이 맞는가?
- 중간 단계가 최종 답과 충돌하지 않는가?
- 사용자가 외부 근거를 통해 확인할 수 있는가?
