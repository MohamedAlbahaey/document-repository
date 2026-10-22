-- Demo users (one admin, the rest employees across departments)
INSERT INTO users (name, email, department, role) VALUES
    ('Amr Hassan',   'amr.hassan@example.com',   'IT',      'admin'),
    ('Sara Ali',     'sara.ali@example.com',     'Finance', 'employee'),
    ('Omar Khaled',  'omar.khaled@example.com',  'Finance', 'employee'),
    ('Nour Samir',   'nour.samir@example.com',   'Legal',   'employee'),
    ('Youssef Adel', 'youssef.adel@example.com', 'IT',      'employee');

-- Some starter tags
INSERT INTO tags (name) VALUES
    ('finance'), ('legal'), ('policy'), ('report'), ('technical');