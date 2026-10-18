# TITLE

## CampusFind - Smart Lost & Found Platform

---

# PROJECT DESCRIPTION

CampusFind is a web application that helps university students report, search for, and recover lost items on campus.

Students often lose personal belongings such as wallets, student cards, earphones, umbrellas, or chargers. Currently, information about lost items is usually shared through social media, group chats, or notice boards, making it difficult to search and track.

CampusFind provides one centralized platform where users can post lost or found items, search existing posts, and contact the person who created the post.

---

# TEAM

Solo Project

- 1 student
- Designed and developed individually

---

# IDEA

## Problem

There is no convenient centralized system for students to find lost belongings on campus.

Lost-and-found information is usually scattered across:

- KakaoTalk groups
- Facebook groups
- University communities
- Physical notice boards

This makes finding a lost item difficult and time-consuming.

## Solution

CampusFind allows students to:

- Report a lost item
- Report a found item
- Browse lost/found posts
- Search and filter items
- Contact the owner/finder
- Mark an item as recovered

---

# USER

The main users are:

- University students
- International students
- University staff

Example:

A student loses their AirPods in the library.

Instead of asking in several group chats, the student can search CampusFind for:

"AirPods - Library"

and check whether someone has already reported finding them.

---

# MVP

The smallest useful version of CampusFind will include:

### 1. User Authentication

Users can:

- Sign up
- Log in
- Log out

---

### 2. Create Lost / Found Posts

Users can create a post containing:

- Item name
- Description
- Category
- Lost or Found status
- Location
- Date
- Image

Example:

Item: AirPods Pro  
Status: Lost  
Location: University Library  
Date: September 10

---

### 3. Browse Items

Users can see all reported items in a simple card-based interface.

Example:

[ Lost ] AirPods Pro  
Library  
September 10

[ Found ] Student Card  
Engineering Building  
September 9

---

### 4. Search and Filter

Users can search items by keyword.

Example:

Search: "AirPods"

Users can also filter by:

- Lost
- Found
- Category
- Location

---

### 5. Item Detail Page

Each item will have its own page showing:

- Image
- Item name
- Description
- Location
- Date
- Lost/Found status
- Contact information

---

### 6. Mark Item as Recovered

When the owner receives the item, the post can be changed from:

Open

to:

Recovered

This prevents users from contacting people about items that have already been returned.

---

# OPTIONAL FEATURE

If there is enough development time, a simple matching feature can be added.

Example:

Lost post:

"Black AirPods Pro, lost near the library"

Found post:

"Black wireless earphones found at the library"

CampusFind can suggest that these two posts may be related based on:

- Category
- Location
- Date
- Keywords

This feature is optional and is not required for the MVP.

---

# TECH STACK

## Frontend

- Next.js
- TypeScript
- Tailwind CSS

## Backend

- Nest.js API Routes + Typescript

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Authentication

## Image Storage

- Supabase Storage

## Deployment

- Vercel

## Version Control

- Git
- GitHub

---

# DEVELOPMENT PLAN

## Week 1

- Design UI
- Create database
- Implement authentication
- Implement Create Lost/Found Post
- Implement item list page

## Week 2

- Item detail page
- Search
- Filter
- Edit/Delete post
- Mark item as recovered

## Week 3

- Improve UI/UX
- Add image upload
- Add optional matching feature
- Testing
- Bug fixing
- Deploy application

---

# FINAL MVP

At the end of the project, the user should be able to:

Register/Login
        ↓
View Lost & Found Items
        ↓
Search / Filter
        ↓
Create a Lost or Found Post
        ↓
View Item Details
        ↓
Contact Owner/Finder
        ↓
Mark Item as Recovered