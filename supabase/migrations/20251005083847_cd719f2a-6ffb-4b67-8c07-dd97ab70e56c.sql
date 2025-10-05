
-- Make created_by nullable for demo data
ALTER TABLE public.clubs ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN created_by DROP NOT NULL;

-- Insert sample clubs for showcase
INSERT INTO public.clubs (id, name, description, category, faculty_coordinator, banner_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Robotics Club', 'Build and program robots, participate in competitions, and explore automation and AI technologies. Perfect for students interested in mechatronics and engineering.', 'technical', 'Dr. Sarah Johnson', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440002', 'Drama Society', 'Express yourself through theater, acting workshops, and stage productions. We organize annual plays and participate in inter-college festivals.', 'cultural', 'Prof. Michael Chen', 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440003', 'Basketball Team', 'Join our championship basketball team for regular practice sessions, tournaments, and inter-college matches. All skill levels welcome!', 'sports', 'Coach David Miller', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440004', 'Coding Club', 'Learn programming, participate in hackathons, and collaborate on open-source projects. Weekly coding challenges and tech talks from industry experts.', 'technical', 'Dr. Emily White', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440005', 'Music Band', 'Rock, jazz, classical - we play it all! Join our band for jam sessions, concerts, and music festivals. Instruments and vocal positions available.', 'cultural', 'Prof. Amanda Brown', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440006', 'Cricket Club', 'Practice cricket techniques, participate in tournaments, and represent the college. Equipment provided, coaching sessions every weekend.', 'sports', 'Coach Robert Taylor', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440007', 'Photography Club', 'Capture moments, learn photo editing, and showcase your work in exhibitions. Monthly photo walks and workshops on lighting and composition.', 'cultural', 'Ms. Lisa Anderson', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=400&fit=crop'),
('550e8400-e29b-41d4-a716-446655440008', 'AI & ML Society', 'Explore artificial intelligence and machine learning through projects, workshops, and research. Collaborate on cutting-edge tech solutions.', 'technical', 'Dr. James Wilson', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop');

-- Insert some sample events
INSERT INTO public.events (id, club_id, title, description, event_date, venue, status) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Robotics Workshop 2024', 'Learn basics of robotics and build your first robot', '2025-11-15 14:00:00+00', 'Engineering Block - Lab 301', 'upcoming'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Annual Drama Fest', 'Three-day theater festival with performances from various colleges', '2025-11-20 18:00:00+00', 'Main Auditorium', 'upcoming'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Inter-College Basketball Tournament', 'Championship tournament with teams from 8 colleges', '2025-11-25 09:00:00+00', 'Sports Complex', 'upcoming'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Hackathon 2024', '24-hour coding marathon with exciting prizes', '2025-12-01 10:00:00+00', 'Computer Science Building', 'upcoming');
