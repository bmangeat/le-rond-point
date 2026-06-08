-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BAR', 'RESTO', 'SOIREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('OPEN', 'BUSY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "city" TEXT,
    "birthday" TIMESTAMP(3),
    "phone" TEXT,
    "instagram" TEXT,
    "snapchat" TEXT,
    "tiktok" TEXT,
    "linkedin" TEXT,
    "notifEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifPush" BOOLEAN NOT NULL DEFAULT false,
    "notifPushOverlap" BOOLEAN NOT NULL DEFAULT true,
    "notifPushBirthday" BOOLEAN NOT NULL DEFAULT true,
    "notifPushPresence" BOOLEAN NOT NULL DEFAULT true,
    "notifPushPhotos" BOOLEAN NOT NULL DEFAULT true,
    "notifPushEvents" BOOLEAN NOT NULL DEFAULT true,
    "isResident" BOOLEAN NOT NULL DEFAULT false,
    "notifPushAsResident" BOOLEAN NOT NULL DEFAULT true,
    "memberColor" INTEGER NOT NULL DEFAULT 1,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "name" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "description" VARCHAR(500),
    "whenAt" TIMESTAMP(3) NOT NULL,
    "placeName" TEXT NOT NULL,
    "placeAddr" TEXT,
    "logisticsKind" TEXT NOT NULL,
    "needsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tricountEnabled" BOOLEAN NOT NULL DEFAULT true,
    "hasPlaylist" BOOLEAN NOT NULL DEFAULT false,
    "playlistUrl" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPhoto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventNeed" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "claimedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventExpense" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "forUserIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventComment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReport" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" VARCHAR(280),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "note" VARCHAR(200),
    "availability" "Availability" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "invitedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Event_whenAt_idx" ON "Event"("whenAt");

-- CreateIndex
CREATE INDEX "EventPhoto_eventId_idx" ON "EventPhoto"("eventId");

-- CreateIndex
CREATE INDEX "EventPhoto_createdAt_idx" ON "EventPhoto"("createdAt");

-- CreateIndex
CREATE INDEX "EventRsvp_eventId_idx" ON "EventRsvp"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_userId_key" ON "EventRsvp"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventNeed_eventId_idx" ON "EventNeed"("eventId");

-- CreateIndex
CREATE INDEX "EventExpense_eventId_idx" ON "EventExpense"("eventId");

-- CreateIndex
CREATE INDEX "EventComment_eventId_idx" ON "EventComment"("eventId");

-- CreateIndex
CREATE INDEX "CommentReport_commentId_idx" ON "CommentReport"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReport_commentId_reporterId_key" ON "CommentReport"("commentId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_invitedUserId_key" ON "Invitation"("invitedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNeed" ADD CONSTRAINT "EventNeed_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNeed" ADD CONSTRAINT "EventNeed_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpense" ADD CONSTRAINT "EventExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventExpense" ADD CONSTRAINT "EventExpense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "EventComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReport" ADD CONSTRAINT "CommentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

