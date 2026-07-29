---
title: "Towards Continually Self-Improving Agents"
title_ko: "Towards Continually Self-Improving Agents"
category: research
date: 2026-07-21
tldr: ""
tldr_ko: "에이전트는 단일 목표를 직접 쫓아서가 아니라, 주어진 trajectory에서 learnalbe novelty를 갖춘 auxiliary task를 찾아서 성장한다."
keywords: [self-improving, agent]
bilingual: true
default_language: ko
math: true
visible: true
secret: true
sitemap: false
---

<section id="post-body-en" data-post-language-panel="en" lang="en" aria-label="English version" markdown="1">

The world inside a benchmark is forgiving. The scope of the problem is predefined, the expected form of the answer is usually known, and once evaluation is complete, nothing new happens. The world in which real-world agents operate is fundamentally different: tools change, rules are revised without warning, and strategies that worked yesterday may fail today. In such an open-ended world, achieving high performance once is not enough. What matters is not whether an agent knows everything from the outset, but whether it can turn unexpected experiences into new capabilities.

An agent that cannot improve itself becomes outdated as soon as its environment changes, whereas an agent that continues to learn from experience can evolve alongside its environment. Self-improvement is therefore not merely an optional path toward building more capable agents; it is a necessary condition for agents to remain useful in an open world.

What, then, should agents learn from? We believe the answer lies in the behavioral records they already generate: their **trajectories**. An agent’s trajectory contains not only successful strategies, but also failed plans, incorrect assumptions, new observations, and trial-and-error interactions with tools. We propose a self-improvement loop that generates new **auxiliary tasks** from these experiences and uses them as training data.

However, not all experiences are equally valuable. Data that merely repeats what the agent already knows increases the amount of training without providing meaningful new information, while data that is novel but unrelated to actual behavior may fail to make the agent more capable. The central question is therefore not simply, “How can we generate more data?” Instead, we argue that effective self-improvement data should satisfy a criterion we call **learnable novelty**: it should be new to the agent, yet structured in a way that allows the agent to learn from it and reuse the resulting knowledge in future decision-making and problem-solving.

This article develops two main ideas:

1. A continuous self-improvement loop that generates auxiliary tasks from trajectories
2. Learnable novelty as a principle for selecting training data within that loop

# 1. Self-Improving AI

Recent studies pursuing very different research directions have all been described as forms of “self-improvement.” To compare them clearly, we first need a simple formulation. Given a current model $\mathcal{M}_\theta$, an improving function $\mathcal{F}$, and a source of improvement $\mathcal{D}_s$, self-improvement can be written as:

$$
\mathcal{M}_{\theta'} \leftarrow \mathcal{F}(\mathcal{M}_\theta, \mathcal{D}_s)
$$

Existing approaches can be categorized according to what they use as $\mathcal{F}$ and $\mathcal{D}_s$.

| Category                            | Improving Function                   | Source of Improvement                | Examples                                                                  |
| ----------------------------------- | ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| Test-Time Refinement                | Revising responses                   | The model’s own responses            | Self-Refine [1], Reflexion [2]                                            |
| Harness, Skill, or Memory Evolution | Modifying the model’s scaffolding    | The model’s own responses            | Darwin Gödel Machine [3], ACE [4]                                         |
| Self-Rewarding                      | Training with self-generated rewards | The model’s own responses            | TTRL [5], TTT-Discover [6], ReST-MCTS* [7], Self-Trained Verification [8] |
| Self-Distillation                   | Training with a privileged teacher   | The model’s own responses            | OPSD [9], SDFT [10], SDPO [11]                                            |
| Zero-Data Self-Play                 | SFT or RL training                   | Zero data                            | R-Zero [12], AZR [13]                                                     |
| **Training on Self-Generated Data** | SFT or RL training                   | Seed tasks, corpora, or trajectories | CoT-Self-Instruct [14], SEAL [15], SPICE [16], SOAR [17]                  |

Among these categories, we focus on **training on self-generated data**, particularly methods that use **trajectories as the source of improvement**.

## 1.1 Why Is Zero-Data Self-Play Prone to Collapse?

The appeal of zero-data self-play is clear: without additional human effort, a model can generate problems, solve them, and learn from the results. However, this loop can easily collapse [18, 19], typically for three reasons.

First, there is **no grounded source**. If generated problems are not connected to real documents, environments, or interactions, greater difficulty does not necessarily imply greater value. Problems generated entirely within the model may appear complex while remaining unrelated to the situations that real agents will encounter.

Second, **exploration can become closer to random generation than exploration for learning**. Creating a new problem and creating a problem that contains something worth learning are not the same. Increasing randomness or surface-level diversity alone does not necessarily produce reusable capabilities.

Third, and most importantly, the **proposer is often optimized to generate problems that are moderately difficult for the solver**. In many approaches, the proposer is rewarded for generating problems whose solver pass rate is close to $0.5$. At that point, self-improvement is effectively reduced to finding problems of moderate difficulty. Yet the cheapest way to reduce the solver’s pass rate is not necessarily to create problems that require genuinely new capabilities. The proposer can instead slightly modify familiar content, paraphrase known problems, or add unnecessary traps. The resulting data may be difficult without being useful.

Rather than continuously generating problems from nothing, we begin with experiences that already exist. This leads to our central question:

> **How can we perform exploration for learning within a given trajectory?**

## 1.2 Why Trajectories?

Our chosen source of improvement, $\mathcal{D}_s$, is the agent’s trajectory. A trajectory may be produced by the current model, another model, or an earlier version of the same agent.

The first reason for using trajectories is their **information density**. A single trajectory may contain the plan the agent created, the environment’s response, the recovery strategy selected after a failure, and the factors that ultimately determined success or failure. In conventional reinforcement learning, this long sequence of interactions is often compressed into a single final reward. However, even when two trajectories receive the same reward, the learning signals contained within them may be entirely different.

Consider a document-retrieval agent that fails during an API call. From the final outcome alone, this appears to be a simple failure. The trajectory, however, may reveal several more specific learning opportunities: what constraints could have been inferred from the error message, what information should have been checked before calling the tool, which recovery action would have been most efficient, and what general rule could prevent similar errors when using other tools. A single failed trajectory can therefore generate multiple auxiliary tasks related to world modeling, error diagnosis, planning, and recovery.

The second reason is the **future that self-improving systems are likely to face**. The data accumulated by future agents will probably resemble massive logs of agent–user and agent–environment interactions rather than carefully curated collections of seed tasks. The important challenge is therefore to transform those logs into useful training data instead of discarding them.

# 2. STAGE: Turning Trajectories into Learning Signals

We call our framework **STAGE: Self-improving via Trajectory-grounded Auxiliary tasks GEneration**. The name also reflects the idea that learning progresses through multiple stages.

The framework consists of two main roles:

* **Meta-Learner, or Proposer:** Decides what should be learned and generates the corresponding training data
* **Learner, or Solver:** Learns from the data generated by the Meta-Learner

```text
Require:
    Meta-Learner π_φ
    Learner π_θ
    Trajectory set 𝒯 = {τ_1, ..., τ_N}
    Iterations I
    Outer epochs K_outer
    Inner epochs K_inner

for t = 1 ... I:
    # 1. Update the Meta-Learner: decide what to learn
    for k = 1 ... K_outer:
        𝒯_B ← SampleBatch(𝒯)
        {(q_i, a_i, c_i)} ← π_φ(𝒯_B, learning_tools)
        r_{m,i} ← Score(q_i, a_i, c_i, π_θ)
        φ ← UpdateMetaLearner(φ, {r_{m,i}})

    # 2. Generate training data
    (Q, A, C) ← π_φ(𝒯, learning_tools)

    # 3. Update the Learner
    for k = 1 ... K_inner:
        θ ← UpdateLearner(θ, Q, A)

return π_φ, π_θ
```

The framework itself is not intended as a fundamentally new algorithm. Rather, it provides a minimal formulation for discussing trajectory-based self-improvement. The main question of this research is what kinds of data can support stable and continuous self-improvement, ultimately producing robust agents.

## 2.1 What Constitutes “Good” Self-Improvement?

Before discussing data selection, we first need to define successful self-improvement. We divide performance into three levels:

* **Absorption on the training set:** How effectively does the model absorb new information from the training data?
* **Consolidation on an in-distribution test set:** Can the model reliably apply what it has learned to new examples from the same distribution?
* **Generalization on an out-of-distribution test set:** Does the improvement transfer to different distributions and environments?

Many self-improvement studies evaluate progress using fixed in-distribution and out-of-distribution test sets. These evaluations are also necessary in our work, but a genuinely self-improving system should ultimately operate in a more open-ended environment. In an open-ended world, we cannot know in advance which tasks or environments will appear, nor can we predefine every future test set. Without a clearly specified final objective, what proxy goal should a self-improving system pursue? This question motivates both auxiliary tasks and learnable novelty.

# 3. Our Philosophy: Auxiliary Tasks and Learnable Novelty

> **Rather than directly optimizing for a single predefined objective, we should build a learning system in which new problems and new capabilities continue to emerge.**

## 3.1 Auxiliary Tasks

To build an agent that performs a particular objective well, it may seem sufficient to train it on action-generation tasks associated with that objective. Our perspective is different. A growing body of research suggests that auxiliary-task learning can improve internal representations, compositional data can strengthen generalization, and learning world models or self-reflection from trajectories can ultimately improve goal-directed behavior.

Trajectories are rich sources of auxiliary tasks. A single interaction log may support questions such as: How did the environment respond after this observation? Why did this plan fail? What are the argument constraints of this tool? Which alternative action would have produced a better outcome? How should the agent recover from this type of failure?

In STAGE, the types of auxiliary tasks generated by the Meta-Learner are controlled through a set of **learning tools**. These may include tools for prediction, diagnosis, counterfactual reasoning, tool-schema induction, and recovery planning.

Our hypothesis is as follows:

> Even when the same trajectories are used, decomposing their internal structure into multiple auxiliary tasks will produce stronger transfer to out-of-distribution environments than training the model to imitate only the final actions.

We do not necessarily expect auxiliary-task training to produce dramatic improvements on in-distribution test sets compared with conventional methods. However, we hypothesize that it will lead to stronger performance in out-of-distribution settings. Even when this does not immediately translate into higher task performance, auxiliary-task training may still strengthen the model’s internal representations. We are therefore also considering how such representational improvements can be measured.

## 3.2 Learnable Novelty

Existing methods often measure the current learner’s pass rate and select problems whose pass rates are approximately $0.5$. The intuition is to avoid problems that are either too easy or completely unsolvable. This signal, however, has two major limitations.

**The quality problem.** Difficulty is a one-dimensional signal. A target difficulty can be achieved using meaningless or low-diversity problems. Pass rate tells us whether a problem is **difficult**, but not whether it contains **useful structure that can be learned**.

**The cost problem.** Estimating a stable pass rate requires multiple rollouts for every candidate problem. As the generation loop scales, this inference cost can dominate the overall computational budget.

We therefore propose a criterion that combines **novelty** with the idea of the **Zone of Proximal Development**. The desired data is not merely something the current model does not know. It should provide meaningful information gain while remaining understandable when the model is given an appropriate clue, principle, or concept. In other words, the data should be both **novel**, meaning that it does not simply repeat what the model already knows, and **learnable**, meaning that it contains reusable structure rather than noise. We call this combination **learnable novelty**.

# 4. Measuring Learnable Novelty

## 4.1 Novelty: Surprisal

The novelty component is relatively straightforward. Given a question $Q$, we measure how unexpected the answer $A$ is to the current learner:

$$
s_{\text{novelty}} = -\log p_\theta(A \mid Q)
$$

If the model already understands the relevant information, surprisal will be low; if the answer is unexpected, surprisal will be high. This measure also requires only a single forward pass, without additional rollouts. However, high surprisal alone does not imply valuable data. Data filled with noise, such as random sequences or incorrect labels, may also be highly surprising to the model. Surprisal captures novelty, but it does not guarantee learnability.

## 4.2 Learnability: Distinguishing Structure from Noise

The most intuitive way to evaluate learnability is to train the model on candidate data and then measure its validation performance. In practice, however, running a separate training loop for every candidate is prohibitively expensive. The result may also depend heavily on the learning rate, batch size, optimizer, number of training steps, and composition of the validation set. Useful data may be undervalued if it has not yet been sufficiently absorbed, while data that happens to benefit a particular validation set may be overvalued.

The concept of **epiplexity** provides a useful lens. Epiplexity [20] focuses on the amount of structural information that a computationally and temporally bounded observer can actually extract from data. Unlike complexity measures that ignore the observer’s computational limitations, epiplexity centers on a practical question:

> What can realistically be learned under limited computational conditions?

From this perspective, the data we want is not merely complex or uncertain. It should contain structure that can be compressed into the model’s parameters and reused in new situations and out-of-distribution problems. The challenge is that epiplexity is itself revealed through a learning process. Although the concept closely matches what we seek, directly measuring it remains computationally expensive.

## 4.3 Our Proxy: Privileged Information

Our proposed alternative is to use **privileged information**. When the Meta-Learner creates a problem, it knows what the problem is intended to teach. We therefore require it to explicitly represent this intention—the central concept needed to solve the problem—as privileged information $C$.

We then make the following assumption:

> **A model that receives the core concept $C$ in context can be treated as an approximation of a model that has already internalized that concept.**

Suppose the current model cannot predict $A$ when given only $Q$, but can predict $A$ accurately when $C$ is also provided. In that case, the problem is unlikely to be pure noise. Instead, it appears to contain structure that can be understood through an explicit and teachable concept.

We define the learnability score as:

$$
s_{\text{learnability}} = \log p_\theta(A \mid Q, C)
$$

This approach has three main advantages. First, it is relatively independent of the training algorithm and its hyperparameters because it estimates whether the data contains something learnable without running a full training procedure. Existing approaches often evaluate post-training performance, inspect gradient directions, or use the area under a loss curve, all of which may depend on the training configuration as well as the model and data.

Second, the method aligns the Meta-Learner’s intention with the learning outcome. To receive a high score, the Meta-Learner must express through $C$ what the generated problem is intended to teach, creating an explicit connection between problem generation and the learning objective.

Third, it has relatively low computational cost. Instead of performing multiple rollouts to estimate a pass rate, or training on every candidate and measuring validation performance, we calculate conditional log-likelihoods. This advantage becomes increasingly important as the self-improvement loop scales.

The final score combines novelty and learnability. We plan to experiment with several choices for the function $g$:

$$
S = g(s_{\text{novelty}}, s_{\text{learnability}})
$$

A simple initial choice is:

$$
g(a,b) = a + b
$$

Under this formulation, the score is proportional to:

$$
\log \frac{p_\theta(A \mid Q, C)}{p_\theta(A \mid Q)}
$$

The interpretation is straightforward:

> **How much does the probability of the correct answer $A$ increase when the core concept $C$ is provided?**

If the model already knows how to solve the problem, the difference before and after receiving $C$ will be small. If the label is incorrect or the problem is dominated by noise, providing $C$ will not sufficiently increase the probability of the answer. If the model cannot currently solve the problem but can solve it after receiving the core concept, the difference will be large.

The third case is the region we seek: a region just beyond the model’s current capabilities, but still within reach of its existing learning capacity. In this sense, learnable novelty resembles Vygotsky’s **Zone of Proximal Development**.

## 4.4 Is This Measurement Sufficient?

Not yet. Several issues remain. First, the score may select cases in which both $p_\theta(A \mid Q, C)$ and $p_\theta(A \mid Q)$ are low, but their relative ratio is large. Some form of calibration or absolute-probability gating may therefore be necessary.

Second, privileged information $C$ may reveal the answer directly rather than express the underlying concept. To prevent this, we are considering a gating mechanism based on the log-likelihood produced by a model that has genuinely internalized the privileged information.

Third, understanding a concept in context is not identical to internalizing it through parameter updates. We must therefore test how strongly the proposed score correlates with actual improvements after training.

# 5. What We Aim to Validate

The purpose of this research is not merely to determine whether STAGE improves performance on a particular benchmark. We aim to investigate three broader questions:

1. **How effective is self-improvement through auxiliary tasks?**
2. **Can a self-improvement loop based on learnable novelty produce robust agents?**
3. **Can the system avoid collapse over repeated rounds of training?**

# Conclusion

Today’s agents generate large amounts of experience through their interactions, yet most learning pipelines do not make full use of that experience. In reinforcement-learning pipelines, long trajectories are often compressed into a single final reward.

We revisit trajectories from the perspective of self-improvement. A Meta-Learner creates **auxiliary tasks** from existing experiences, a Learner trains on those tasks, and the updated Learner influences the next round of data generation. However, simply constructing a loop does not guarantee meaningful self-improvement. Without a principled criterion for deciding what should be learned, the system may repeatedly generate easy problems, create difficult but meaningless tasks, or amplify its own biases.

Moreover, our goal should extend beyond predictable future tasks. We need agents that can adapt effectively to new and out-of-distribution environments. For this reason, we place **learnable novelty** at the center of the framework. The objective is to identify data that is both new to the Learner and rich in learnable, reusable structure.

Many questions remain unresolved. We must empirically determine how well privileged context approximates actual parameter updates, whether auxiliary-task training improves action generation and out-of-distribution generalization, and how collapse can be prevented during repeated cycles of self-improvement.

We believe that one of the defining capabilities of a self-improving system is the ability to determine **what it should learn next**. This is the direction in which we intend to continue our research.

### References
[1] Madaan et al. "[Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/abs/2303.17651)" 2023

[2] Shinn et al. "[Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)" 2023

[3] Zhang et al. "[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents](https://arxiv.org/abs/2505.22954)" 2025

[4] Zhang et al. "[Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models](https://arxiv.org/abs/2510.04618)" 2025

[5] Zuo et al. "[TTRL: Test-Time Reinforcement Learning](https://arxiv.org/abs/2504.16084)" 2025

[6] Yuksekgonul et al. "[Learning to Discover at Test Time](https://arxiv.org/abs/2601.16175)" 2026

[7] Zhang et al. "[ReST-MCTS*: LLM Self-Training via Process Reward Guided Tree Search](https://arxiv.org/abs/2406.03816)" 2024

[8] Wu et al. "[Self-Trained Verification for Training- and Test-Time Self-Improvement](https://arxiv.org/abs/2605.30290)" 2026

[9] Zhao et al. "[Self-Distilled Reasoner: On-Policy Self-Distillation for Large Language Models](https://arxiv.org/abs/2601.18734)" 2026

[10] Shenfeld et al. "[Self-Distillation Enables Continual Learning](https://arxiv.org/abs/2601.19897)" 2026

[11] Hübotter et al. "[Reinforcement Learning via Self-Distillation](https://arxiv.org/abs/2601.20802)" 2026

[12] Huang et al. "[R-Zero: Self-Evolving Reasoning LLM from Zero Data](https://arxiv.org/abs/2508.05004)" 2025

[13] Zhao et al. "[Absolute Zero: Reinforced Self-play Reasoning with Zero Data](https://arxiv.org/abs/2505.03335)" 2025

[14] Yu et al. "[CoT-Self-Instruct: Building High-Quality Synthetic Prompts for Reasoning and Non-Reasoning Tasks](https://arxiv.org/abs/2507.23751)" 2025

[15] Zweiger et al. "[Self-Adapting Language Models](https://arxiv.org/abs/2506.10943)" 2025

[16] Liu et al. "[SPICE: Self-Play In Corpus Environments Improves Reasoning](https://arxiv.org/abs/2510.24684)" 2025

[17] Sundaram et al. "[Teaching Models to Teach Themselves: Reasoning at the Edge of Learnability](https://arxiv.org/abs/2601.18778)" 2026

[18] Bailey et al. "[Scaling Self-Play with Self-Guidance](https://arxiv.org/abs/2604.20209)" 2026

[19] Pu et al. "[Survive or Collapse: The Asymmetric Roles of Data Gating and Reward Grounding in Self-Play RL](https://arxiv.org/abs/2605.22217)" 2026

[20] Finzi et al. "[From Entropy to Epiplexity: Rethinking Information for Computationally Bounded Intelligence](https://arxiv.org/abs/2601.03220)" 2026

</section>

<section id="post-body-ko" data-post-language-panel="ko" lang="ko" aria-label="한국어 버전" hidden markdown="1">

벤치마크 안의 세계는 친절하다. 문제의 범위가 정해져 있고, 정답의 형태도 대체로 알고 있으며, 평가가 끝나면 더 이상 새로운 일이 벌어지지 않는다. 하지만 실제 에이전트가 살아갈 세계는 정반대다. 도구는 바뀌고, 규칙은 예고 없이 수정되며, 어제까지 통하던 전략이 오늘은 실패할 수 있다. 이런 open-ended world에서는 한 번 높은 성능을 달성하는 것만으로는 충분하지 않다. 중요한 것은 처음부터 모든 것을 알고 있는가가 아니라, 예상하지 못한 경험을 만났을 때 그 경험을 다음 능력으로 바꿀 수 있는가이다.

스스로 개선하지 못하는 에이전트는 환경이 변하는 순간 과거의 모델이 되지만, 경험에서 계속 배울 수 있는 에이전트는 환경과 함께 진화한다. 결국 self-improvement는 더 똑똑한 에이전트를 만들기 위한 선택지가 아니라, 열린 세계에서 에이전트가 계속 유용한 존재로 남기 위한 조건이다.

그렇다면 에이전트는 무엇으로부터 스스로 학습해야 하는가?

우리는 답이 에이전트가 이미 남기고 있는 행동 기록, 즉 trajectory 안에 있다고 본다. 에이전트의 trajectory에는 성공한 전략뿐 아니라 실패한 계획, 잘못된 가정, 새로운 관측, 도구 사용의 시행착오가 함께 축적된다. 우리는 이 경험으로부터 새로운 **보조 과제(auxiliary task)**를 생성하고, 이를 다시 학습에 활용하는 자기개선 루프를 제안한다. 하지만 모든 경험이 같은 가치를 갖는 것은 아니다. 이미 알고 있는 내용을 반복하는 데이터는 학습량만 늘릴 뿐이고, 새롭지만 실제 행동과 무관한 데이터는 에이전트를 더 유능하게 만들지 못한다. 따라서 핵심 질문은 단순히 “어떻게 더 많은 데이터를 만들 것인가”가 아니다.

우리는 좋은 self-improvement를 위한 데이터의 기준을 **learnable novelty**라고 본다. 이는 에이전트에게 새로우면서도, 미래의 의사결정과 문제 해결에 재사용할 수 있는 경험을 뜻한다. 이 글에서는 다음 두 가지에 대해 이야기한다.

1. trajectory로부터 auxiliary task를 생성하는 지속적 자기개선 루프
2. 그 루프에서 학습할 데이터를 선택하는 원리인 learnable novelty

# 1. Self-improving AI

최근에는 서로 다른 방향의 연구들이 모두 “self-improving”이라는 이름 아래 소개되고 있다. 이들을 비교하려면 먼저 self-improvement를 단순한 형태로 정리할 필요가 있다. 현재 모델 $\mathcal{M}\_\theta$, Improving Function $\mathcal{F}$, Source of Improvement $\mathcal{D}\_s$가 있을 때:

$$\mathcal{M}_{\theta'} \leftarrow \mathcal{F}(\mathcal{M}_\theta, \mathcal{D}_s)$$

$\mathcal{F}$와 $\mathcal{D}_s$에 무엇을 넣느냐에 따라 기존 연구들이 깔끔하게 나뉜다.

| 유형 | Improving function | Source | 예시 |
| --- | --- | --- | --- |
| Test-time Refine | 응답 수정 | 자기 응답 | Self-Refine [1], Reflexion [2] |
| Harness/Skill/Memory Evolution | 스캐폴딩 수정 | 자기 응답 | Darwin Gödel Machine [3], ACE [4] |
| Self-Rewarding | 자체 reward로 학습 | 자기 응답 | TTRL [5], TTT-Discover [6], ReST-MCTS* [7], Self-Trained Verification [8] |
| Self-Distillation | Privileged teacher로 학습 | 자기 응답 | OPSD [9], SDFT [10], SDPO [11] |
| Self-play with zero data | SFT/RL 학습 | Zero-data | R-Zero [12], AZR [13] |
| **Training on self-generated data** | SFT/RL 학습 | Seed task, corpus, trajectory | CoT-Self-Instruct [14], SEAL [15], SPICE [16], SOAR [17] |

우리는 이 가운데 **training on self-generated data**, 특히 **trajectory를 source로 사용하는 방식**에 집중한다.

## 1.1 Zero-data self-play는 왜 무너지기 쉬운가?

Zero-data self-play의 매력은 분명하다. 별도의 human effort 없이 모델이 문제를 만들고, 풀고, 그 결과로 다시 학습할 수 있다. 그러나 이 루프는 쉽게 collapse한다 [18, 19]. 원인은 대체로 세 가지가 얽혀 있다.

첫째, **ground된 source가 없다.** 생성된 문제가 현실의 문서, 환경, 상호작용에 연결되어 있지 않으면 난이도는 올라가도 의미는 올라가지 않을 수 있다. 모델 내부에서만 순환하는 문제는 복잡해 보이지만 실제 에이전트가 마주할 상황과 무관할 수 있다.

둘째, **탐색이 학습을 위한 탐색이 아니라 무작위 생성에 가깝다.** 새로운 문제를 만드는 것과 배울 것이 있는 문제를 만드는 것은 다른 일이다. 무작위성이나 표면적 다양성만 높여서는 다음 행동에 재사용할 수 있는 능력이 생기지 않는다.

셋째, 그리고 가장 결정적으로, **proposer의 목표가 "solver가 적당히 풀 수 있는 문제"에 맞춰져 있다.** 많은 방식에서 proposer는 solver의 pass rate가 0.5에 가까운 문제를 만들도록 유도된다. 문제는 이 순간 자기개선이 사실상 ‘적당히 어려운 문제 찾기’로 축소된다는 점이다. 난이도를 맞추는 가장 값싼 방법은 새로운 능력을 요구하는 문제를 만드는 것이 아니다. 이미 알고 있는 내용을 조금 비틀거나, 표현만 바꾸거나, 불필요한 함정을 추가해도 pass rate는 낮출 수 있다. 그렇게 만들어진 데이터는 어렵기는 하지만 유익하지 않을 수 있다.

그래서 우리는 무에서 문제를 계속 만들어내는 대신, 이미 존재하는 경험을 출발점으로 삼는다.

> **주어진 trajectory에서 학습을 위한 탐색(exploration for learning)을 어떻게 수행할 것인가?**

이 질문이 우리가 다루려는 문제의 중심이다.

## 1.2 Why 'Trajectory'?

우리가 선택한 source $\mathcal{D}_s$는 에이전트의 trajectory다. 현재 모델이 직접 만든 기록일 수도 있고, 다른 모델이나 과거 버전의 에이전트가 남긴 기록일 수도 있다.

trajectory를 고른 첫 번째 이유는 **정보 밀도**다. 하나의 trajectory에는 다음 정보가 함께 들어 있다.

- 어떤 계획을 세웠는가
- 환경이 어떻게 반응했는가
- 실패 뒤 어떤 복구 전략을 택했는가
- 최종적으로 무엇이 성공과 실패를 갈랐는가

일반적인 RL 학습에서는 이 긴 과정을 최종 reward 하나로 압축해 버리기 쉽다. 하지만 reward가 같더라도 두 trajectory가 담고 있는 학습 신호는 전혀 다를 수 있다. 예를 들어 문서 검색 에이전트가 API 호출에 실패했다고 해보자. 최종 결과만 보면 단순한 실패다. 그러나 trajectory 안에는 훨씬 구체적인 학습 과제가 숨어 있다.

- 에러 메시지에서 어떤 제약을 추론할 수 있는가
- 도구 호출 전에 어떤 정보를 확인했어야 하는가
- 실패 뒤 어떤 복구 행동이 가장 효율적인가
- 같은 종류의 오류를 다른 도구에서도 피하려면 어떤 규칙을 배워야 하는가

하나의 실패 기록에서 world modeling, error diagnosis, planning, recovery에 관한 서로 다른 auxiliary task를 만들 수 있다.

두 번째 이유는 **self-improving system이 실제로 마주할 미래**다. 앞으로 축적될 source는 잘 정제된 seed task 묶음보다 에이전트–사용자, 에이전트–환경 상호작용이 쌓인 방대한 로그에 가까울 가능성이 높다. 그렇다면 중요한 문제는 이미 존재하는 로그를 버리지 않고 학습 데이터로 바꾸는 일이다. 우리는 이 문제를 지금부터 푸는 것이 맞다고 보았다.

# 2. STAGE: trajectory를 학습 신호로 바꾸는 루프

우리가 쓰는 프레임워크를 STAGE(**S**elf-improving via **T**rajectory-grounded **A**uxiliary tasks **GE**neration)라고 부른다. 학습이 여러 단계(stage)를 밟아 간다는 의미도 겸한다.

구성은 두 역할로 나뉜다.
- **Meta-Learner (Proposer)**: 무엇을 배울 것인지 결정하고 학습 데이터를 만든다.
- **Learner (Solver)**: Meta-Learner가 만든 데이터로 실제 학습한다.

```text
Require:
    Meta-Learner π_φ
    Learner π_θ
    Trajectory set 𝒯 = {τ_1, ..., τ_N}
    Iterations I
    Outer epochs K_outer
    Inner epochs K_inner

for t = 1 ... I:
    # 1. Meta-Learner 업데이트: 무엇을 배울 것인가
    for k = 1 ... K_outer:
        𝒯_B ← SampleBatch(𝒯)
        {(q_i, a_i, c_i)} ← π_φ(𝒯_B, learning_tools)
        r_{m,i} ← Score(q_i, a_i, c_i, π_θ)
        φ ← UpdateMetaLearner(φ, {r_{m,i}})

    # 2. 학습 데이터 생성
    (Q, A, C) ← π_φ(𝒯, learning_tools)

    # 3. Learner 업데이트
    for k = 1 ... K_inner:
        θ ← UpdateLearner(θ, Q, A)

return π_φ, π_θ
```

이 프레임워크 자체가 새롭다기보다, trajectory 기반 self-improvement를 논의하기 위한 최소한의 제안에 가깝다. 본 연구에서 진짜 다루고 싶은 것은 어떠한 데이터가 안정적으로 continuous하게 self-improving 하여 robust한 agent를 만들어 낼 수 있는지에 관한 것이다.

## 2.1 무엇을 "좋은" self-improvement 라고 할 수 있을까?

데이터를 논하기 전에, self-improving의 성공을 무엇으로 볼지부터 정해야 한다. 우리는 Performance를 측정할 대상에 따라 다음과 같이 나눌 수 있다.

- **Absorption (train set)**: 학습 데이터의 새로운 정보를 얼마나 흡수했는가
- **Consolidation (ID test set)**: 흡수한 것을 같은 분포의 새 사례에 안정적으로 적용하는가
- **Generalization (OOD test set)**: 다른 분포와 환경까지 효과가 번져 가는가

많은 self-improving 연구는 고정된 ID/OOD test set을 기준으로 개선을 측정한다. 우리 연구에서도 이 평가는 필요하다. 다만 진정한 self-improving system이 목표로 해야 할 환경은 더 열려 있다.

Open-ended world에서는 앞으로 어떤 과제와 환경이 등장할지 알 수 없다. 미래의 test set을 미리 정의할 수도 없다. 그렇다면 명확한 최종 목표가 없는 상태에서 자기개선 시스템은 무엇을 proxy goal로 삼아야 할까? 이 질문에서 auxiliary task와 learnable novelty가 나온다.

# 3. Our Philosophy: Auxiliary Task와 Learnable Novelty

> **특정 목표 하나를 직접 공략하기보다, 새로운 문제와 새로운 능력이 계속 생겨나는 학습 시스템을 만들자.**

## 3.1 Auxiliary Task

목적을 잘 수행하는 에이전트를 잘 만들고 싶다면 주어진 goal에 대해 action generation을 하는 task로 학습시키면 될 수 있지만, 우리의 관점은 조금 다르다. Auxiliary task를 학습하는 과정에서 internal representation이 강화되고, compositional한 데이터가 일반화를 끌어올리며, trajectory로부터 world modeling이나 self-reflection을 함께 배우는 것이 정작 목표 수행을 더 잘하게 만드는 것을 확인하는 여러 연구들이 있다. trajectory는 이런 auxiliary task의 광맥이다. 하나의 로그에서 "이 관측 다음에 환경은 어떻게 반응했는가", "이 계획은 왜 실패했는가", "이 도구의 인자 규칙은 무엇인가" 같은 서로 다른 종류의 문제를 뽑아낼 수 있다.

STAGE에서는 Meta-Learner에게 제공하는 **learning tool**의 구성을 통해 어떤 auxiliary task를 만들지 조절한다. 예를 들어 prediction, diagnosis, counterfactual reasoning, tool-schema induction, recovery planning처럼 서로 다른 생성 도구를 둘 수 있다.

우리의 가설은 다음과 같다.

> 같은 trajectory를 사용하더라도 최종 action만 모방하는 학습보다, 그 안의 구조를 여러 auxiliary task로 분해해 학습하는 편이 OOD 환경에서 더 강한 전이를 만들 수 있다.

이러한 auxiliary task를 통해서 학습된 모델은 기존 방법론으로 학습된 모델에 비해 ID test set에 대해서 큰 향상은 없을 거라고 생각한다. 하지만, OOD test set에서 더 잘할 수 있을 거라는 생각이 있고 그렇지 않더라도 internal representation이 강화된다고 생각하기에 이를 잘 측정할 수 있는 방향에 대해서도 고민중이다.

## 3.2 Learnable Novelty

기존 방식에서는 현재 learner의 pass rate를 측정하고, 대략 0.5 부근의 문제를 선택하는 경우가 많다. 너무 쉬운 문제도, 전혀 풀 수 없는 문제도 피하겠다는 직관이다. 이 신호에는 두 가지 문제가 있다.

**품질 문제.** 난이도는 1차원 신호다. 무의미하거나 다양성이 낮은 문제로도 목표 난이도를 맞출 수 있다. pass rate는 문제가 **어려운지**는 알려주지만, 그 문제에 **배울 만한 구조가 있는지**는 알려주지 않는다.

**비용 문제.** 후보 문제마다 여러 번 rollout을 수행해야 안정적인 pass rate를 얻을 수 있다. 생성 루프가 커질수록 이 inference cost가 전체 비용을 지배한다.

그래서 우리는 **novelty**와 **Zone of Proximal Development**의 발상을 결합한 기준을 사용하려 한다. 원하는 데이터는 단순히 현재 모델이 모르는 데이터가 아니다. 현재 모델에게 충분한 information gain을 주면서도, 적절한 단서나 개념을 제공하면 이해할 수 있는 데이터여야 한다. 즉 다음 두 조건을 동시에 만족해야 한다.

1. **Novel**: 지금 모델이 이미 알고 있는 내용을 반복하지 않는다.
2. **Learnable**: 노이즈가 아니라, 모델이 흡수하고 재사용할 수 있는 구조를 담고 있다.

우리는 이를 **learnable novelty**라고 부른다.

# 4. Learnable Novelty를 어떻게 측정할 것인가

## 4.1 Novelty: Surprisal

novelty 쪽은 비교적 간단하다. 문제 $Q$를 보고 정답 $A$를 현재 learner가 얼마나 예상하지 못하는지를 보면 된다.

$$s_{\text{novelty}} = -\log p_\theta(A \mid Q)$$

이미 잘 아는 내용이라면 surprisal은 낮다. 반대로 현재 모델이 예상하지 못한 답이라면 높다. 별도의 rollout 없이 한 번의 forward pass로 계산할 수 있다는 장점도 있다.

그러나 surprisal만 높다고 좋은 데이터는 아니다. 노이즈가 가득 한 데이터 (e.g., 난수열이나 잘못된 라벨) 역시 모델에게는 매우 놀라울 수 있다. 새롭다는 사실은 보장하지만, 배울 가치까지 보장하지는 않는다.

## 4.2 Learnablity: 새로움과 노이즈를 가르는 기준

가장 직관적인 방법은 후보 데이터를 실제로 학습시킨 뒤 validation 성능을 확인하는 것이다. 하지만 데이터 하나를 판정할 때마다 학습 루프를 돌리는 방식은 현실적으로 비싸다. 게다가 결과가 학습률, batch size, optimizer, 학습 횟수, validation set 구성에 크게 좌우될 수 있다. 유용한 데이터라도 아직 충분히 반영되지 않으면 가치가 낮게 측정될 수 있고, 특정 validation set에만 유리한 데이터가 과대평가될 수도 있다.

여기서 **epiplexity**라는 개념을 유용한 렌즈로 가져올 수 있다. epiplexity [20]는 계산 능력과 학습 시간이 제한된 관찰자가 데이터에서 **실제로 추출할 수 있는 구조적 정보의 양**에 주목한다. 관찰자의 계산 한계를 무시하는 복잡도와 달리, “현실적인 조건에서 무엇이 학습 가능한가”를 중심에 둔다. 이 관점에서 우리가 원하는 데이터는 단순히 복잡하거나 불확실한 데이터가 아니다.

> **모델의 파라미터에 압축될 수 있고, 이후의 새로운 상황과 분포 밖 문제에 재사용될 수 있는 구조를 많이 담은 데이터**

문제는 epiplexity 역시 본질적으로 학습 과정을 통해 드러난다는 점이다. 개념은 우리가 찾는 대상과 가깝지만, 그대로 사용하기에는 계산 비용이 크다.

## 4.3 Our Proxy Measurement: Using Privileged Information

우리가 택한 우회로는 **privileged information**이다. Meta-Learner는 문제를 만들 때 *무엇을 가르치려 했는지*를 알고 있다. 우리는 그 의도, 즉 문제를 풀기 위한 핵심 개념을 **privileged information $C$**로 명시하게 한다. 그리고 다음과 같이 가정한다.

> **핵심 개념 $C$를 in-context로 받은 모델은, 그 개념을 이미 내재화한 모델의 근사로 볼 수 있다.**

만약 현재 모델이 $Q$만 보고는 $A$를 예측하지 못하지만, $C$를 함께 받았을 때는 $A$를 잘 예측한다면 어떨까. 이 문제는 단순한 노이즈가 아니라, 명시 가능한 개념을 통해 해결되는 구조를 담고 있다고 볼 수 있다. learnability score를 다음과 같이 둔다.

$$s_{\text{learnability}} = \log p_\theta(A \mid Q, C)$$

이 방식에는 세 가지 장점이 있다.

1. **학습 알고리즘과 하이퍼파라미터에 영향을 받지 않는다.** 학습을 돌리지 않고도 "이 데이터에서 배울 것이 있는가"를 판정한다. 기존의 데이터의 유용함을 다루는 연구들에서는 학습을 한 후에 성능을 보거나 gradient direction을 확인하거나 loss 그래프의 면적을 활용한다. 이는 모델과 데이터 이외에도 학습 방법, 하이퍼파라미터에 영향을 받을 수 있는 문제가 있는데 우리는 이를 간단한 방법으로 해결하고자 하였다.
2. **Meta-Learner의 의도와 학습 결과를 정렬시킨다.** Meta-Learner는 점수를 받으려면 “이 문제를 통해 무엇을 가르치려는가”를 $C$로 표현해야 한다. 문제 생성과 학습 목표 사이의 정렬을 강제하는 셈이다.
3. **계산 비용이 낮다.** 후보마다 여러 번 rollout해 pass rate 측정하거나 학습후 validation score를 측정하는 대신, 조건부 log-likelihood를 계산한다. self-improvement loop를 크게 확장할 때 중요한 차이다.

최종 score는 novelty와 learnability를 결합해 정의한다. (함수 $g$에 대해서는 여러 실험을 해볼 예정이다.)

$$S = g(s_{\text{novelty}}, s_{\text{learnability}}), \qquad g(a,b) = a + b$$

직관적으로 이 합은 다음과 비례한다.

$$\log \frac{p_\theta(A \mid Q, C)}{p_\theta(A \mid Q)}$$

이 값의 의미는 직관적이다.

> **핵심 개념 \(C\)를 알려주었을 때 정답 \(A\)의 확률이 얼마나 크게 상승하는가?**

- 이미 아는 문제라면 \(C\)를 주기 전후의 차이가 작다.
- 라벨이 잘못되었거나 노이즈가 큰 문제라면 \(C\)를 주어도 정답 확률이 충분히 오르지 않는다.
- 지금은 풀지 못하지만 핵심 개념을 알면 풀 수 있는 문제라면 값이 커진다.

우리가 찾는 영역은 세 번째다. 현재 모델이 아직 알지 못하지만, 지금의 능력으로 학습 가능한 바로 바깥의 영역이다. 이 점에서 learnable novelty는 Vygotsky의 **Zone of Proximal Development**와 닮아 있다.

## 4.4 이 방식이 충분한가?

아직은 아니다. 실제로는 몇 가지 경우를 더 생각해봐야 한다.

- $p_\theta(A \mid Q, C)$와 $p_\theta(A \mid Q)$가 모두 낮은데 상대적인 비율만 큰 사례가 선택될 수 있기 때문에 이를 보정하는 방법이 필요하다.
- privileged information $C$가 핵심 개념이 아니라 정답을 누설할 수 있다. 이를 방지하기 위해 privileged information을 내재한 모델의 log-likelihood에 대한 gating을 고려해야 한다.
- in-context로 이해되는 것과 파라미터 학습을 통해 안정적으로 내재화되는 것은 완전히 같지 않다. 우리의 score가 실제 학습 후 성능 향상과 얼마나 상관되는지 검증해야 한다.


# 5. 우리가 검증하려는 것

이 연구에서 확인하고 싶은 것은 단순히 STAGE가 특정 benchmark의 점수를 올리는지가 아니다. 다음의 질문에 대해서 탐구해보려고 한다.

1. **Auxiliary task를 통한 self-improving의 효과는 어떠한가?**
2. **Learnable Novelty를 활용한 self-improving loop를 통해서 Robust한 Agent를 만들 수 있는가?**
3. **반복적인 학습에서도 collapse이 없는가?**

## 글을 마치며...

오늘날 에이전트는 매 순간 많은 경험을 만들지만, 대부분의 학습 파이프라인은 그 경험을 충분히 사용하지 못한다. 강화학습을 통한 학습에서는  긴 trajectory는 최종 reward 하나로 압축하여 학습된다.

우리는 이 trajectory를 self-improving 관점에서 다시 접근한다. Meta-Learner가 주어진 경험 속에서 **auxiliary task**를 만들고, Learner가 그것을 학습하며, 그 결과가 다시 다음 데이터 생성을 바꾸는 루프를 구성한다.

하지만 루프를 만든 것만으로 자기개선이 일어나지는 않는다. 무엇을 배울지 선택하는 기준이 없다면 시스템은 쉬운 문제를 반복하거나, 어렵지만 무의미한 문제를 만들거나, 자신의 편향을 증폭시키는 방향으로 흘러갈 수 있다. 또한, 우리는 예측가능한 미래 task를 넘어서 OOD환경에서도 잘 적응할 수 있는 agent를 만들어야 한다.

그래서 우리는 **learnable novelty**를 중심에 둔다. 즉, learner에게 새롭고 learnable한 구조를 담고있는 데이터에 집중하는 것이다.

아직 해결되지 않은 문제는 많다. privileged context가 실제 parameter update를 얼마나 잘 근사하는지, auxiliary task가 과연 action generation을 잘하게 하고 OOD generalization에 기여하는지, 반복적인 self-improvement 과정에서 collapse를 어떻게 막을지는 실험으로 확인해야 한다.

우리는 self-improving system의 핵심 중 하나를 **자신이 무엇을 배우면 좋은지를 찾아내는 능력**이라고 생각하며 연구를 이어 나갈 예정이다.

### References
[1] Madaan et al. "[Self-Refine: Iterative Refinement with Self-Feedback](https://arxiv.org/abs/2303.17651)" 2023

[2] Shinn et al. "[Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)" 2023

[3] Zhang et al. "[Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents](https://arxiv.org/abs/2505.22954)" 2025

[4] Zhang et al. "[Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models](https://arxiv.org/abs/2510.04618)" 2025

[5] Zuo et al. "[TTRL: Test-Time Reinforcement Learning](https://arxiv.org/abs/2504.16084)" 2025

[6] Yuksekgonul et al. "[Learning to Discover at Test Time](https://arxiv.org/abs/2601.16175)" 2026

[7] Zhang et al. "[ReST-MCTS*: LLM Self-Training via Process Reward Guided Tree Search](https://arxiv.org/abs/2406.03816)" 2024

[8] Wu et al. "[Self-Trained Verification for Training- and Test-Time Self-Improvement](https://arxiv.org/abs/2605.30290)" 2026

[9] Zhao et al. "[Self-Distilled Reasoner: On-Policy Self-Distillation for Large Language Models](https://arxiv.org/abs/2601.18734)" 2026

[10] Shenfeld et al. "[Self-Distillation Enables Continual Learning](https://arxiv.org/abs/2601.19897)" 2026

[11] Hübotter et al. "[Reinforcement Learning via Self-Distillation](https://arxiv.org/abs/2601.20802)" 2026

[12] Huang et al. "[R-Zero: Self-Evolving Reasoning LLM from Zero Data](https://arxiv.org/abs/2508.05004)" 2025

[13] Zhao et al. "[Absolute Zero: Reinforced Self-play Reasoning with Zero Data](https://arxiv.org/abs/2505.03335)" 2025

[14] Yu et al. "[CoT-Self-Instruct: Building High-Quality Synthetic Prompts for Reasoning and Non-Reasoning Tasks](https://arxiv.org/abs/2507.23751)" 2025

[15] Zweiger et al. "[Self-Adapting Language Models](https://arxiv.org/abs/2506.10943)" 2025

[16] Liu et al. "[SPICE: Self-Play In Corpus Environments Improves Reasoning](https://arxiv.org/abs/2510.24684)" 2025

[17] Sundaram et al. "[Teaching Models to Teach Themselves: Reasoning at the Edge of Learnability](https://arxiv.org/abs/2601.18778)" 2026

[18] Bailey et al. "[Scaling Self-Play with Self-Guidance](https://arxiv.org/abs/2604.20209)" 2026

[19] Pu et al. "[Survive or Collapse: The Asymmetric Roles of Data Gating and Reward Grounding in Self-Play RL](https://arxiv.org/abs/2605.22217)" 2026

[20] Finzi et al. "[From Entropy to Epiplexity: Rethinking Information for Computationally Bounded Intelligence](https://arxiv.org/abs/2601.03220)" 2026


</section>
