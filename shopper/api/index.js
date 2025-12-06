const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const redis = require('./redis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Получение списка всех товаров
app.get('/api/products', async (req, res) => {
    try {
        const cached = await redis.get('products');
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        const result = await db.query(
            'SELECT id, name, description, price, image_url as image FROM products ORDER BY id'
        );
        
        await redis.set('products', JSON.stringify(result.rows), { EX: 60 });
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ 
            ok: false, 
            error: 'Ошибка при загрузке товаров' 
        });
    }
});

// Получение конкретного товара по ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Неверный ID товара' 
            });
        }
        
        const cacheKey = `product:${id}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        const result = await db.query(
            'SELECT id, name, description, price, image_url as image FROM products WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                ok: false, 
                error: 'Товар не найден' 
            });
        }
        
        await redis.set(cacheKey, JSON.stringify(result.rows[0]), { EX: 30 });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error fetching product ${req.params.id}:`, err);
        res.status(500).json({ 
            ok: false, 
            error: 'Ошибка при загрузке товара' 
        });
    }
});

// Эндпоинт для оформления заказа
app.post('/api/orders', async (req, res) => {
    let client;
    try {
        console.log('='.repeat(50));
        console.log('Получен запрос на оформление заказа');
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('='.repeat(50));
        
        const { cart, customer } = req.body || {};
        
        // Валидация
        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Корзина пуста или имеет неверный формат' 
            });
        }
        
        // Фильтруем валидные товары
        const validCart = cart.filter(item => 
            item && 
            typeof item === 'object' && 
            !isNaN(Number(item.id)) && 
            !isNaN(Number(item.quantity)) &&
            Number(item.quantity) > 0
        );
        
        if (validCart.length === 0) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Нет валидных товаров в корзине' 
            });
        }
        
        // Получаем ID товаров как числа
        const productIds = validCart.map(item => Number(item.id));
        console.log('ID товаров для проверки:', productIds);
        
        let productsResult;
        if (productIds.length > 0) {
            const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
            
            productsResult = await db.query(
                `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
                productIds
            );
            
            console.log('Найдено товаров в БД:', productsResult.rows.length);
        }
        
        // Рассчитываем итоговую сумму на основе реальных цен из БД
        let totalAmount = 0;
        const orderItems = [];
        
        validCart.forEach(cartItem => {
            const productId = Number(cartItem.id);
            const quantity = Number(cartItem.quantity);
            
            // Ищем товар в результатах из БД
            let product = null;
            let price = 0;
            
            if (productsResult && productsResult.rows) {
                product = productsResult.rows.find(p => p.id === productId);
            }
            
            if (product) {
                // Используем реальную цену из БД
                price = parseFloat(product.price);
            } else {
                // Если товар не найден в БД, используем демо-цену (можно заменить на 0)
                console.log(`Товар ${productId} не найден в БД, используем демо-цену`);
                price = 1000; // Демо-цена
            }
            
            const itemTotal = price * quantity;
            totalAmount += itemTotal;
            
            orderItems.push({
                id: productId,
                name: product ? product.name : `Товар ${productId}`,
                price: price,
                quantity: quantity,
                itemTotal: itemTotal
            });
        });
        
        // Генерируем номер заказа
        const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const orderDate = new Date().toISOString();
        
        // Логируем заказ
        console.log('='.repeat(50));
        console.log('НОВЫЙ ЗАКАЗ ОФОРМЛЕН');
        console.log('='.repeat(50));
        console.log(`Номер заказа: ${orderId}`);
        console.log(`Дата: ${new Date(orderDate).toLocaleString('ru-RU')}`);
        console.log('Клиент:', customer || 'Не указан');
        console.log('Товары:');
        orderItems.forEach(item => {
            console.log(`  ${item.name} - ${item.quantity} × ${item.price.toFixed(2)} ₽ = ${item.itemTotal.toFixed(2)} ₽`);
        });
        console.log(`Итого: ${totalAmount.toFixed(2)} ₽`);
        console.log('='.repeat(50));
        
        // Возвращаем успешный ответ с реальной суммой
        res.json({ 
            ok: true, 
            message: 'Заказ успешно оформлен!', 
            orderId,
            orderDate,
            totalAmount: totalAmount.toFixed(2),
            totalItems: validCart.reduce((sum, item) => sum + Number(item.quantity), 0),
            items: orderItems,
            customer: customer || {
                name: 'Не указано',
                email: 'Не указано',
                phone: 'Не указано'
            }
        });
        
    } catch (err) {
        console.error('Ошибка при обработке заказа:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ 
            ok: false, 
            error: 'Внутренняя ошибка сервера при обработке заказа',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Эндпоинт для получения реальных цен товаров по ID
app.post('/api/products/prices', async (req, res) => {
    try {
        const { productIds } = req.body;
        
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Неверный список ID товаров' 
            });
        }
        
        const numericIds = productIds.map(id => Number(id)).filter(id => !isNaN(id));
        
        if (numericIds.length === 0) {
            return res.json({ ok: true, prices: {} });
        }
        
        const placeholders = numericIds.map((_, i) => `$${i + 1}`).join(',');
        
        const result = await db.query(
            `SELECT id, price FROM products WHERE id IN (${placeholders})`,
            numericIds
        );
        
        const prices = {};
        result.rows.forEach(row => {
            prices[row.id] = parseFloat(row.price);
        });
        
        res.json({ ok: true, prices });
        
    } catch (err) {
        console.error('Error fetching prices:', err);
        res.status(500).json({ 
            ok: false, 
            error: 'Ошибка при получении цен' 
        });
    }
});

// Проверка здоровья API
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        await redis.ping();
        
        res.json({
            ok: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            redis: 'connected'
        });
        
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(500).json({
            ok: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Один или несколько сервисов недоступны'
        });
    }
});

// Обработка 404 для API маршрутов
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        ok: false, 
        error: 'API endpoint не найден' 
    });
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
    console.log('='.repeat(50));
    console.log(`API сервер запущен на порту ${port}`);
    console.log('='.repeat(50));
});

module.exports = app;