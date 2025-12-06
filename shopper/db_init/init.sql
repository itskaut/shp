CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT
);

INSERT INTO products (name, description, price, image_url) VALUES
('Футбольный мяч', 'Качественный футбольный мяч, размер 5', 1990.00, 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=80&w=600&auto=format&fit=crop'),
('Кроссовки беговые', 'Лёгкие кроссовки для бега', 4990.00, 'https://images.unsplash.com/photo-1528701800489-476a2a1a1b06?q=80&w=600&auto=format&fit=crop'),
('Боксерские перчатки', 'Набор боксерских перчаток', 2590.00, 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop'),
('Спортивная бутылка', 'Бутылка для воды 750мл', 390.00, 'https://images.unsplash.com/photo-1558981403-c5f989d2d6c1?q=80&w=600&auto=format&fit=crop'),
('Эспандер', 'Резиновый эспандер для упражнений', 450.00, 'https://images.unsplash.com/photo-1584467735845-1b6a6f5b2f1b?q=80&w=600&auto=format&fit=crop')
ON CONFLICT DO NOTHING;
