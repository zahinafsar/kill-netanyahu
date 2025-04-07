'use server'

import { prisma } from '@/lib/prisma'

export async function createUser(name: string, pin: string) {
  // Validate name length and format
  if (name.length < 2 || name.length > 50) {
    throw new Error('Name must be between 2 and 50 characters')
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { name }
    })

    if (existingUser) {
      throw new Error('Username already taken')
    }

    const user = await prisma.user.create({
      data: {
        name,
        pin,
        score: 0
      }
    })
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function loginUser(name: string, pin: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        name,
        pin
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    return user
  } catch (error) {
    console.error('Error logging in user:', error)
    throw error
  }
}

export async function updateUserScore(userId: string, score: number) {
  try {
    // Get current user to check their score
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Only update if new score is higher
    if (!currentUser || score > currentUser.score) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { score }
      });
      return user;
    }

    return currentUser;
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  }
}

export async function getTopScorers() {
  try {
    const topScorers = await prisma.user.findMany({
      orderBy: { score: 'desc' },
      take: 3,
      select: {
        name: true,
        score: true
      }
    })
    return topScorers
  } catch (error) {
    console.error('Error fetching top scorers:', error)
    throw error
  }
} 