import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    const response = await axios.post('http://localhost:8000/api/auth/login', {
      email,
      password
    });
    console.log(response.data);
    const { token, user } = response.data;
    const cookieStore = await cookies();
    cookieStore.set('token', token);
    cookieStore.set('user', JSON.stringify(user));

    return NextResponse.json({ token, user });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

