// src/components/coach/CoachConnectForm.tsx
'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

const questions = [
    {
        question: "Have you ever had a coach before?",
        key: "had_coach_before",
        options: ["Yes", "No"],
        type: 'boolean'
    },
    {
        question: "What kind of support are you looking for right now?",
        key: "support_needed",
        options: ["Career growth or transitions", "Interpersonal or leadership skills", "Personal well-being and resilience", "All of the above", "Not sure yet"],
    },
    {
        question: "What life stage best describes you?",
        key: "life_stage",
        options: ["18–24", "25–30", "31–40", "41–50", "51–64", "65+"],
    },
    {
        question: "Do you have a preference for your coach's gender?",
        key: "coach_gender_preference",
        options: ["Male", "Female", "No preference"],
    },
    {
        question: "What language would you prefer your coach to speak?",
        key: "coach_language_preference",
        options: ["English", "Spanish", "French", "Portuguese", "Arabic", "Mandarin", "Other", "No preference"],
    },
    {
        question: "What coaching style feels like the best fit for you right now?",
        key: "coaching_style_preference",
        options: ["Supportive and encouraging", "Help me stay accountable", "Insightful and reflective", "A balanced mix", "Not sure yet"],
    },
];

export default function CoachConnectForm() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const handleAnswer = (option: string) => {
        const currentQuestion = questions[currentStep];
        const value = currentQuestion.type === 'boolean' ? option === 'Yes' : option;
        setAnswers(prev => ({ ...prev, [currentQuestion.key]: value }));
    };

    const nextStep = () => {
        if (currentStep < questions.length -1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/coach-connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit form.');
            }
            setIsFinished(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isFinished) {
        return (
            <div className="text-center p-6">
                 <h2 className="text-2xl font-bold text-green-600 mb-4">🎯 Thanks for sharing!</h2>
                 <p className="text-gray-700">I’ll use your answers to help match you with a coach who best fits your needs.</p>
            </div>
        )
    }

    const currentQuestion = questions[currentStep];
    const selectedAnswer = answers[currentQuestion.key];

    return (
        <div className="w-full max-w-lg">
            <p className="text-lg font-semibold text-gray-800 mb-6">{currentQuestion.question}</p>
            <div className="space-y-3">
                {currentQuestion.options.map(option => (
                    <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-gray-800
                            ${(selectedAnswer === option || (typeof selectedAnswer === 'boolean' && option === (selectedAnswer ? 'Yes' : 'No')))
                                ? 'bg-blue-500 text-white border-blue-500' 
                                : 'bg-white hover:bg-gray-100 border-gray-300'}`
                        }
                    >
                        {option}
                    </button>
                ))}
            </div>
            <div className="mt-8 flex justify-end">
                <Button onClick={nextStep} disabled={selectedAnswer === undefined || isSubmitting}>
                    {isSubmitting ? 'Submitting...' : (currentStep === questions.length - 1 ? 'Submit' : 'Next')}
                </Button>
            </div>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        </div>
    )
}