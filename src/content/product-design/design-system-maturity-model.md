---
title: "Design System Maturity Model"
description: "A new way to measure design system maturity for zeroheight: a six-axis model, a book, and a free assessment tool. Built to give teams a language for where their system actually is, at the moment the industry started asking harder questions about what design systems are worth."
timeline: "Jun 2026 - Aug 2026"
pubDate: "Aug 13 2026"
client: "zeroheight"
role: "Concept, Research, Writing, Product Design, Front-end Development"
tags: ["Design systems", "Writing", "Product design", "Research"]
---

## Introduction

Ask a design system lead how mature their system is and you'll get a number, a shrug, or both. "We're probably a three out of five?" A three at what, though?

It's a question I've been asking teams for years, and the honest answer is that nobody has had a good way to respond. Teams can feel whether their system is healthy or struggling, but they can't accurately talk about it it. That gap was survivable while design systems were new enough that enthusiasm carried them. It isn't survivable now, with budgets under scrutiny, headcount challenged, and the whole discipline being asked to justify itself.

So I built something to fix it: a maturity model that charts a system across six independent axes rather than collapsing it into a single score, a book that argues the case and works through each axis in depth, and a free assessment tool that turns the whole thing into eight minutes and a shareable diagnosis.

This case study covers all three: the argument the model makes, the writing that gave it substance, and the product work that made it usable.

## Why a single number wasn't enough

Sparkbox's Design System Maturity Model, developed by Ben Callahan and his team, has been shaping how we talk about system growth for years. Its four stages describe a system's life like a product's life, and part of their genius is how instantly recognisable they are. Every practitioner who reads them has the same reaction: "oh, we're teenage." 

We'd been recommending it for years. But the limitation of any single-track model is baked into the format... it assumes a system matures as one coherent thing. In practice, the systems I see through zeroheight mature all over the place.

A grassroots system built by craftspeople can hit Stage 4 on component quality while its governance is one person doing it alongside their real job. A well-funded, mandate-driven programme can have immaculate process ceremony wrapped around a component library nobody trusts. Average either into a single score and you get "a three," which hides the actual diagnosis. The gap between your strongest and weakest axis is where your next move lives, and a single score conceals it by design.

There was also a more pressing reason... the maturity models the community grew up on were written before AI-assisted design and development were part of anyone's daily workflow. Whether your design system is the context AI tools build from, or the thing they route around, is now a live maturity question. A system that was exemplary by every 2023 standard can be bypassed daily by every AI-assisted workflow in the building.

So I kept Sparkbox's four stages entirely unchanged and altered what they measure, running them across six independent axes: **Foundations**, **Documentation & Knowledge**, **Governance & Team**, **Adoption**, **Measurement & Impact**, and **AI Readiness**. So, instead of a score at the end, you get a radar diagram that shows you the shape of your system.

<div class="case-study__photos case-study__photos__two-up">

<div>
    <Image src="/images/maturity-figjam.png" alt="TK">
    <p class="case-study__photos__caption">The FigJam plan, where I mapped out the entire model and assessment before building anything.</p>
</div>
<div>
    <Image src="/images/maturity-figma.png" alt="TK">
    <p class="case-study__photos__caption">The website design before starting development, created using the existing zeroheight marketing design system.</p>
</div>

</div>

## Behaviour, not artefacts

Almost every maturity conversation falls into the same trap: counting artefacts. Do you have tokens? A component library? A docs site? A contribution model? Tick enough boxes and you're mature. It's appealing because artefacts are easy to see, easy to audit, and easy to buy. 

I've watched the failure mode play out repeatedly. A team sets everything up perfectly – layered tokens, live docs site, written processes – on a build-it-and-they-will-come assumption, and nine times out of ten they don't come. The teams whose systems genuinely power their organisations treat the system as infrastructure, with community and communication at the centre. Their maturity isn't in what they've built. It's in how the organisation behaves around what they've built.

That became the guiding light of the maturity model: maturity is measured in organisational behaviours and culture first, and artefacts second. Every stage definition in the model is written in those terms. Not "do you have tokens?" but what happens when you change one. Behaviours tell you what an organisation trusts.

## Writing the book

The model needed somewhere to live properly. Alongside the tool, I wanted the reasoning to be availa ble in full, so *Measuring Design System Maturity* became the substance behind the assessment.

What started as a downloadable PDF became a 15,000 word book. I wanted to go indepth on the thinking behind the axes, the archetypes, the recommendations, and the future of design systems when it comes to maturity. 

As well as writing the book, I designed and typeset the whole thing, leaning on my past lives as a graphic designer and type nerd. I also illustrated the entire book, creating visual representations and icons to represent every axes and arrchetype. Representing something as messy as 'governance' was a challenge!

## Building the assessment

A book makes the argument, but a tool gets it into people's hands. The assessment had to do real diagnostic work in the time someone will actually give you.

The questionnaire was the hard part, and the constraint was brutal. The fewer questions the better, but too few and the diagnosis is worthless. I settled on 29 questions and about eight minutes. I'd have preferred fewer, but that was the minimum that still produced a defensible read. The diagnostic core is four questions per axis, each with four graduated options mapping to the four stages.

The framing rule was the same one that governs the model. Wherever possible, questions are behavioural rather than artefactual – not "do you have contribution docs?" but "what actually happens when someone wants to contribute?" Artefacts are easy to have and easy to ignore. Behaviour is where maturity actually lives. Writing four graduated options per question, each recognisable enough that people self-select honestly rather than aspirationally, took far longer than writing the stage definitions did.

Alongside the diagnostic questions, the tool collects a small amount of context (organisation size, governance model, and so on). None of it touches your scores, but all of it tunes the recommendations. "Formalise your governance" means something completely different at a 40-person startup than at an enterprise, and the advice should know the difference. A startup matching the Green Bud shouldn't over-formalise governance at all, but an enterprise with the same score is dangerously under-resourced. 

Building it inside zeroheight's existing marketing site was a deliberate trade-off. It put the assessment where people already arrive rather than behind a separate domain, and it meant no auth, no accounts, and no barrier between reading the argument and testing yourself against it. It also meant working within what that platform allows, and within the existing design system, which meant creating something that felt bespoke enough, but still felt like zeroheight.

I designed the entire experience, and then coded it using Next.js and Tailwind. I also created a custom scoring algorithm that would give me the six-axis shape and the matched archetype.

<div class="case-study__photos case-study__photos__two-up">

<div>
    <Image src="/images/maturity-website.png" alt="TK">
    <p class="case-study__photos__caption">The final landing page for the assessment, with some illustrations created by our amazing in-house brand designer.</p>
</div>
<div>
    <Image src="/images/maturity-book.png" alt="TK">
    <p class="case-study__photos__caption">The book, a labour of love entirely created by me, currently in production.</p>
</div>

</div>

## Conclusion

The model launched in July 2026 alongside the blog post making its case, and the book follows it. What I keep coming back to is how much of the work was writing rather than designing. The six axes are a product decision, but the reason they're useful is the 15,000 words underneath them defining what each stage concretely means and what behaviour reveals it.

It also sharpened something I'd half-believed for years. Measuring behaviours and communicating value aren't two separate jobs. A maturity model that only tells you where you are is an interesting diagnostic, but I wanted to create one that would help teams justify themselves to the people who control their funding. 

Design systems are sliding into the trough of disillusionment, and the way out isn't another conference talk about craft. It's the unglamorous work: earning engineering's trust, externalising the why, funding the team like infrastructure, making the system the easiest path, measuring in the asker's language, and serving it all to the machines. This project is my attempt to give teams a map for that, and a vocabulary they can use in the rooms where the decisions actually get made.
