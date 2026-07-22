---
title: "Towards Continually Self-Improving Agents"
title_ko: "Towards Continually Self-Improving Agents"
category: research
date: 2026-07-21
tldr: ""
tldr_ko: "에이전트는 단일 목표를 직접 쫓아서가 아니라, 주어진 trajectory에서 useful novelty를 갖춘 보조 과제를 찾아서 성장한다."
keywords: [self-improving, agent]
bilingual: true
default_language: ko
math: true
visible: true
secret: true
sitemap: false
---

<section id="post-body-en" data-post-language-panel="en" lang="en" aria-label="English version" markdown="1">

Only korean version

</section>

<section id="post-body-ko" data-post-language-panel="ko" lang="ko" aria-label="한국어 버전" hidden markdown="1">

LLM 에이전트의 성능은 흔히 하나의 숫자로 요약된다. 주어진 태스크를 몇 퍼센트나 해결했는가. 하지만 실제 환경에서 에이전트의 능력은 단발성 정답률만으로 설명되지 않는다. 현실의 에이전트는 고정된 입력을 한 번 처리하고 끝나는 시스템이 아니다. 새로운 도구를 호출하고, 불완전한 문서를 해석하며, 예상하지 못한 관측과 마주한다. 계획은 자주 실패하고, 환경은 계속 변하며, 에이전트는 그때마다 다음 행동을 다시 선택해야 한다. 중요한 것은 이미 알고 있는 문제를 얼마나 잘 푸는가뿐 아니라, 경험을 통해 얼마나 빠르게 더 나은 에이전트가 되는가이다.

그러나 오늘날 대부분의 학습 파이프라인에서 에이전트의 성장은 여전히 인간 감독에 의존한다. 새로운 환경이 등장할 때마다 인간이 demonstration을 만들고, reward를 설계하고, evaluation criterion을 정의해야 한다. 이 구조에서는 에이전트의 학습 속도가 결국 인간이 피드백을 생산하는 속도를 넘어서기 어렵다.

열린 환경에서 장기간 작동하는 에이전트를 만들고자 한다면, self-improvement는 부가적인 기능이 아니다. 그것은 지속적으로 유용한 에이전트가 되기 위한 핵심 전제다.

그렇다면 에이전트는 무엇으로부터 스스로 학습해야 하는가?

우리는 답이 에이전트가 이미 남기고 있는 행동 기록, 즉 trajectory 안에 있다고 본다. 에이전트의 trajectory에는 성공한 전략뿐 아니라 실패한 계획, 잘못된 가정, 새로운 관측, 도구 사용의 시행착오가 함께 축적된다. 우리는 이 경험으로부터 새로운 보조 과제(auxiliary task)를 생성하고, 이를 다시 학습에 활용하는 자기개선 루프를 제안한다. 하지만 모든 경험이 같은 가치를 갖는 것은 아니다. 이미 알고 있는 내용을 반복하는 데이터는 학습량만 늘릴 뿐이고, 새롭지만 실제 행동과 무관한 데이터는 에이전트를 더 유능하게 만들지 못한다. 따라서 핵심 질문은 단순히 “어떻게 더 많은 데이터를 만들 것인가”가 아니다.

어떤 경험이 에이전트의 다음 행동을 실제로 개선하는가?

우리는 이 기준을 **useful novelty**라고 부른다. useful novelty는 에이전트에게 새로우면서도, 미래의 의사결정과 문제 해결에 실질적으로 도움이 되는 경험을 의미한다. 이 글에서는 trajectory로부터 auxiliary task를 생성하는 지속적 자기개선 루프를 소개하고, 그 루프에서 학습할 데이터를 선택하는 원리로서 useful novelty를 제안한다. 궁극적으로 우리가 묻는 것은 하나다.

에이전트가 인간이 새로운 문제를 가르쳐 주기를 기다리는 대신, 주어진 경험을 스스로 다음 학습 과제로 바꿀 수 있는가?

## Self-improving AI

"self-improving"이라는 키워드 아래에는 서로 꽤 다른 연구들이 섞여 있다. 정리를 위해 아주 단순한 형식을 하나 두자. 현재 모델 $\mathcal{M}\_\theta$, 개선 함수 $\mathcal{F}$, 개선의 원천 $\mathcal{D}\_s$가 있을 때:

$$\mathcal{M}_{\theta'} \leftarrow \mathcal{F}(\mathcal{M}_\theta, \mathcal{D}_s)$$

$\mathcal{F}$와 $\mathcal{D}_s$에 무엇을 넣느냐에 따라 기존 연구들이 깔끔하게 나뉜다.

| 유형 | Improving function | Source | 예시 |
| --- | --- | --- | --- |
| Test-time Refine | 응답 수정 | 자기 응답 | Self-Refine, Reflexion |
| Harness/Skill/Memory Evolution | 스캐폴딩 수정 | Zero-data | Darwin Gödel Machine, ACE |
| Test-time Training | SFT/RL 학습 | 자기 응답 | TTRL, TTT-Discover |
| Self-Rewarding | 자체 reward로 학습 | 자기 응답 | ReST-MCTS*, Self-Trained Verification |
| Self-Distillation | Privileged teacher로 학습 | 자기 응답 | OPSD, SDFT, SDPO |
| Self-play with zero data | SFT/RL 학습 | Zero-data | R-Zero, AZR |
| **Training on self-generated data** | **SFT/RL 학습** | **Seed task, corpus, trajectory** | **CoT-Self-Instruct, SEAL, SPICE, SOAR** |

이 중, 우리는 "Training on self-generated data"영억에 집중하고자 한다.

### Zero-data self-play는 왜 무너지는가

Zero-data self-play는 매력적인 아이디어다. 아무 데이터 없이 proposer와 solver가 서로를 밀어 올린다. 그런데 여러 연구가 공통적으로 collapse를 보고한다. 원인은 세 가지가 얽혀 있다.

첫째, **ground된 source가 없다.** 생성된 문제가 현실의 어떤 구조에도 닻을 내리고 있지 않으면, 난이도는 올라가도 의미는 올라가지 않는다.

둘째, **탐색이 학습을 위한 탐색이 아니라 무작위 생성에 가깝다.** 새로운 문제를 만드는 것과 배울 것이 있는 문제를 만드는 것은 다른 일이다.

셋째, 그리고 가장 결정적으로, **proposer의 목표가 "solver가 적당히 풀 수 있는 문제"에 맞춰져 있다.** pass rate 0.5 근처를 겨냥하는 순간, 시스템은 난이도라는 1차원 축 위에서만 움직인다. 그 축을 만족시키는 가장 값싼 방법은 새로운 능력을 요구하는 문제가 아니라, 이미 아는 것을 살짝 꼬아 놓은 문제를 대량 생산하는 것이다.

그래서 우리의 출발점은 이렇게 바뀐다. 무에서 문제를 만들어내는 대신, **주어진 source에서 학습을 위한 탐색(exploration for learning)을 어떻게 잘할 것인가.**

### 왜 하필 trajectory인가

우리가 고른 source $\mathcal{D}_s$는 에이전트의 trajectory다. 현재 모델이 만든 것일 수도 있고, 다른 모델이 남긴 것일 수도 있다.

trajectory를 고른 첫 번째 이유는 정보량이다. 하나의 trajectory에는 도구 호출의 결과, 환경의 반응, 중간 계획, 실패의 흔적, 복구 과정이 전부 들어 있다. 이걸 RL의 rollout 데이터로만 소비하는 것은 — 즉 최종 보상 하나로 요약해 버리는 것은 — 있는 정보의 극히 일부만 쓰는 셈이다. 실제로 동일한 trajectory에서 world modeling이나 self-reflection을 함께 학습시키면 목표 수행 능력 자체가 좋아진다는 결과들이 이를 뒷받침한다.

두 번째 이유는 미래의 형태다. 앞으로 self-improvement가 실제로 일어날 현장을 상상해 보면, 그것은 깨끗한 seed task 셋이 아니라 **에이전트–사용자, 에이전트–환경 상호작용이 쌓인 방대한 로그**일 가능성이 높다. 그 로그를 학습 데이터로 바꾸는 문제를 지금부터 푸는 것이 맞다고 봤다.

## STAGE: trajectory를 학습 신호로 바꾸는 루프

우리가 쓰는 프레임워크를 STAGE(**S**elf-improving via **T**rajectory-grounded **A**uxiliary tasks **GE**neration)라고 부른다. 학습이 여러 단계(stage)를 밟아 간다는 의미도 겸한다.

구성은 두 역할로 나뉜다.
- **Meta-Learner (Proposer)**: *무엇을 배울 것인가*를 결정한다.
- **Learner (Solver)**: 만들어진 데이터로 학습한다.

```
Require: Meta-Learner π_φ, Learner π_θ, Trajectory set T = {τ_1, ..., τ_Nt}
Require: Iteration T, outer epochs K_outer, inner epochs K_inner

for t = 1 ... T:
    # --- Meta-Learner 학습 (무엇을 배울 것인가) ---
    for k = 1 ... K_outer:
        T_B = {τ_1, ..., τ_B}                          # trajectory 배치
        {(q_i, a_i)} ← π_φ(τ, learning_tool)           # 학습 전략 생성
        r_{m,i} = f(q_i, a_i, π_θ)                     # 데이터 품질 보상
        φ ← Update(φ, {r_{m,i}})                       # prompt 혹은 weight 갱신

    # --- 학습 데이터 생성 ---
    (Q, A) ← π_φ(T)

    # --- Learner 학습 ---
    for k = 1 ... K_inner:
        θ ← Update(θ, (Q, A))

return π_φ, π_θ
```

이 프레임워크 자체가 새롭다기보다, trajectory 기반 self-improvement를 논의하기 위한 최소한의 제안에 가깝다. 진짜 질문은 그 안에 있다. `r_{m,i}`, 즉 **좋은 데이터를 무엇으로 판정할 것인가.**

## 무엇이 "좋은" self-improvement인가

데이터를 논하기 전에, 개선의 성공을 무엇으로 볼지부터 정해야 한다. 우리는 세 층으로 나눈다.

- **Absorption (train set)**: 학습 데이터의 새로운 정보를 얼마나 흡수했는가
- **Consolidation (ID test set)**: 흡수한 것을 같은 분포의 새 사례에 안정적으로 적용하는가
- **Generalization (OOD test set)**: 다른 분포와 환경까지 효과가 번져 가는가

셋은 서로 대체재가 아니다. Absorption만 높으면 암기이고, Consolidation까지만 높으면 좁은 특화다. 우리가 원하는 것은 셋의 균형이 유지되는 루프다. 그런데 여기서 불편한 사실이 하나 있다. **이 세 지표는 우리가 ID와 OOD를 미리 정의할 수 있는 통제된 상황에서만 측정 가능하다.** 열린 세계에서는 무엇이 ID이고 무엇이 OOD인지 계속 움직이고, 애초에 우리가 놓치고 있는 축이 존재한다.

그렇다면 측정할 수 없는 것을 향해 나아가야 할 때, 무엇을 대리 목표로 삼아야 하는가?

## 우리의 관점: Auxiliary Task와 Useful Novelty

> **특정 목표를 직접 풀려고 하지 말고, 새로운 문제와 새로운 능력이 계속 생겨나는 시스템을 만들자.**

### 1. Auxiliary Task: 단일 목표를 넘어서

에이전트를 잘 만들고 싶다면 에이전트 태스크로 학습시키면 될 것 같지만, 여러 결과가 그 반대를 가리킨다. 보조 과제를 학습하는 과정에서 internal representation이 강화되고, compositional한 데이터가 일반화를 끌어올리며, trajectory로부터 world modeling이나 self-reflection을 함께 배우는 것이 정작 목표 수행을 더 잘하게 만든다.

trajectory는 이런 보조 과제의 광맥이다. 하나의 로그에서 "이 관측 다음에 환경은 어떻게 반응했는가", "이 계획은 왜 실패했는가", "이 도구의 인자 규칙은 무엇인가" 같은 서로 다른 종류의 문제를 뽑아낼 수 있다. STAGE에서는 Meta-Learner에게 주어지는 **learning tool**의 구성으로 이 축을 조절한다.

### 2. Useful Novelty: pass rate를 넘어서

기존 방식은 현재 learner의 pass rate를 재서 0.5 근처의 문제를 고른다. 이 신호에는 두 가지 문제가 있다.

**품질 문제.** 앞서 말했듯 난이도는 1차원이고, 무의미하거나 다양성 없는 문제로도 얼마든지 목표 난이도를 맞출 수 있다. pass rate는 문제가 *어려운지*는 알려주지만 *배울 게 있는지*는 알려주지 않는다.

**비용 문제.** 후보 문제마다 매번 rollout을 돌려야 한다. 루프를 크게 돌릴수록 이 비용이 지배적이 된다.

그래서 우리는 **Zone of Proximal Development**의 발상과 **novelty**의 발상을 합친 기준을 쓴다. 즉, 현재 모델에게 information gain을 **충분한 양으로, 그리고 올바른 방향으로** 줄 수 있는 데이터. 잘 모르는 영역이되, 지금의 모델이 손을 뻗으면 닿는 영역을 의미한다.

이것을 `useful novelty`라고 부른다. 이제 이걸 어떻게 재느냐가 남는다.

## Useful Novelty를 측정하기

### Novelty: surprisal

novelty 쪽은 비교적 간단하다. 문제 Q를 보고 정답 A를 얼마나 예상하지 못하는가를 그대로 쓴다.

$$s_{\text{novelty}} = -\log p_\theta(A \mid Q)$$

이미 아는 것이면 surprisal이 낮고, 모르는 것이면 높다. rollout 없이 forward pass 한 번으로 끝난다.

### Usefulness: 왜 어려운가

문제는 usefulness다. 높은 surprisal은 "새롭다"만 보장한다. 난수열은 surprisal이 최대지만 배울 것은 없다. 가장 직관적인 답은 "학습시켜 보고 validation 성능을 보자"이다. 하지만 실용적이지 않다. validation set의 구성에 따라 정작 유용한 것을 놓칠 수 있고, 학습률이나 데이터 양 같은 조건 때문에 아직 반영되지 않은 유용성은 보이지 않는다. 무엇보다 데이터 하나 판정하는 데 학습 루프 하나가 든다.

여기서 **epiplexity**라는 개념이 유용한 렌즈를 준다. epiplexity는 계산 능력과 학습 시간이 제한된 관찰자가 데이터에서 **실제로 추출할 수 있는 구조적 정보의 양**을 가리킨다. 섀넌 엔트로피나 콜모고로프 복잡도가 관찰자의 계산 한계를 고려하지 않는 것과 달리, epiplexity는 "무엇이 현실적으로 학습 가능한가"를 중심에 둔다. 모델이 배울 수 있는 규칙·패턴과, 의사난수나 혼돈계처럼 제한된 시간 안에는 예측 불가능한 **time-bounded entropy**를 구분한다는 뜻이다.

이 렌즈로 보면 우리가 원하는 데이터의 정체가 분명해진다. 단지 복잡하거나 불확실한 데이터가 아니라, **모델의 파라미터에 압축되어 새로운 상황과 분포 밖 일반화에 재사용될 수 있는 구조를 많이 담은 데이터**다. 문제는 epiplexity 역시 학습 곡선을 통해 정의된다는 점이다. 개념은 정확하지만 그대로는 쓸 수 없다.

### 우리의 대리 측정: privileged context

우리의 우회로는 이렇다. Meta-Learner는 문제를 만들 때 *무엇을 가르치려 했는지*를 알고 있다. 그 의도, 즉 문제를 풀기 위한 핵심 개념을 **privileged information $C$**로 명시하게 한다. 그리고 이렇게 가정한다. **$C$를 in-context로 받은 모델은 그 개념을 이미 내재화한 모델의 근사다.** 만약 그 모델이 A를 잘 생성한다면, 이 문제는 실제로 학습 가능한 구조를 담고 있다는 뜻이다.

$$s_{\text{useful}} = \log p_\theta(A \mid Q, C)$$

이 대리 측정의 이점은 세 가지다.

1. **학습 알고리즘과 하이퍼파라미터에 독립적이다.** 학습을 돌리지 않고도 "이 데이터에서 배울 것이 있는가"를 판정한다.
2. **Meta-Learner의 의도와 학습 결과를 정렬시킨다.** $C$를 명시해야 점수가 나오므로, Meta-Learner는 자기가 무엇을 가르치려는지 스스로 분명히 해야 한다.
3. **비용이 낮다.** rollout이 아니라 조건부 log-likelihood 한 번이다.

### 두 항을 합치면

$$S = g(s_{\text{novelty}}, s_{\text{useful}}), \qquad g(a,b) = a + b$$

직관적으로 이 합은 다음과 비례한다.

$$\log \frac{p_\theta(A \mid Q, C)}{p_\theta(A \mid Q)}$$

즉 **개념 $C$를 알려줬을 때 정답의 확률이 얼마나 뛰어오르는가**이다. 이미 아는 문제라면 분자와 분모가 비슷해 값이 낮고, 순수한 잡음이라면 $C$를 줘도 오르지 않아 역시 낮다. 값이 높은 지점은 정확히 그 사이 — 지금은 못 하지만 핵심 개념 하나면 할 수 있게 되는 영역이다. 이는 Vygotsky의 "Zone of Proximal Development"와 유사한 개념이다.


## Main Experiments
STAGE framework 안에서 어떠한 경우에 불안정한 학습이 진행되고 'useful novelty'의 효과는 어떠한지 확인해볼 예정이다. 또한, 


### References
[1] A et al. "[title](link)" Year

</section>
