import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ingredientItemSchema = z.object({
  foodItemId: z.string(),
  quantity: z.number().positive(),
});

const mealOptionSchema = z.object({
  optionNumber: z.number().int().positive(),
  description: z.string(),
  ingredients: z.array(ingredientItemSchema).default([]),
});

const mealSchema = z.object({
  name: z.string().min(1),
  time: z.string(),
  orderIndex: z.number().int(),
  isTrainingDay: z.boolean(),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  icon: z.string().optional(),
  options: z.array(mealOptionSchema),
});

const supplementSchema = z.object({
  name: z.string().min(1),
  dose: z.string().min(1),
  timing: z.string().min(1),
  icon: z.string().optional(),
});

const nutritionPlanSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  totalProtein: z.number().int().min(0),
  totalCarbsTrain: z.number().int().min(0),
  totalCarbsRest: z.number().int().min(0),
  totalFatTrain: z.number().int().min(0),
  totalFatRest: z.number().int().min(0),
  totalKcalMin: z.number().int().min(0),
  totalKcalMax: z.number().int().min(0),
  rules: z.string(),
  meals: z.array(mealSchema),
  supplements: z.array(supplementSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = nutritionPlanSchema.parse(body);

    // Deactivate existing plans
    await prisma.nutritionPlan.updateMany({
      where: { clientId: data.clientId, active: true },
      data: { active: false },
    });

    const plan = await prisma.nutritionPlan.create({
      data: {
        trainerId: session.user.id,
        clientId: data.clientId,
        name: data.name,
        totalProtein: data.totalProtein,
        totalCarbsTrain: data.totalCarbsTrain,
        totalCarbsRest: data.totalCarbsRest,
        totalFatTrain: data.totalFatTrain,
        totalFatRest: data.totalFatRest,
        totalKcalMin: data.totalKcalMin,
        totalKcalMax: data.totalKcalMax,
        rules: data.rules,
        meals: {
          create: data.meals.map((meal) => ({
            name: meal.name,
            time: meal.time,
            orderIndex: meal.orderIndex,
            isTrainingDay: meal.isTrainingDay,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            icon: meal.icon,
            options: {
              create: meal.options.map((opt) => ({
                optionNumber: opt.optionNumber,
                description: opt.description,
                items: {
                  create: opt.ingredients.map((ing, idx) => ({
                    foodItemId: ing.foodItemId,
                    quantity: ing.quantity,
                    orderIndex: idx,
                  })),
                },
              })),
            },
          })),
        },
        supplements: {
          create: data.supplements,
        },
      },
      include: {
        meals: {
          include: {
            options: {
              include: { items: { include: { foodItem: true } } },
            },
          },
        },
        supplements: true,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
