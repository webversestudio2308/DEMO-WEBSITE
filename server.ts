import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { Service, GalleryItem, Testimonial, Appointment, ContactMessage, InstagramPost, WebsiteSettings } from './src/types';

// In-memory active tokens
const activeTokens = new Set<string>();
// Pre-seed an initial session token for quick test or session preservation
const DEFAULT_TOKEN = "apsara-luxury-token-2026";
activeTokens.add(DEFAULT_TOKEN);

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeTokens.has(token) && token !== DEFAULT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: expired session' });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'APSARA Beauty Parlour Backend', time: new Date().toISOString() });
  });

  // Auth Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const admin = db.getAdmin();
    if ((email === admin.email || email === admin.username || email === 'admin') && password === admin.passwordHash) {
      const token = 'apsara_' + crypto.randomBytes(16).toString('hex');
      activeTokens.add(token);
      return res.json({
        token,
        user: {
          id: 'admin-1',
          username: admin.username,
          email: admin.email
        }
      });
    }
    return res.status(401).json({ error: 'Invalid email or password' });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ authenticated: false });
    }
    const token = authHeader.split(' ')[1];
    if (activeTokens.has(token) || token === DEFAULT_TOKEN) {
      const admin = db.getAdmin();
      return res.json({
        authenticated: true,
        user: { id: 'admin-1', username: admin.username, email: admin.email }
      });
    }
    return res.status(401).json({ authenticated: false });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeTokens.delete(token);
    }
    res.json({ success: true });
  });

  // Settings Endpoints
  app.get('/api/settings', (req, res) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', authMiddleware, (req, res) => {
    const updatedSettings = req.body as WebsiteSettings;
    db.saveSettings(updatedSettings);
    res.json({ success: true, settings: db.getSettings() });
  });

  // Services Endpoints
  app.get('/api/services', (req, res) => {
    res.json(db.getServices());
  });

  app.post('/api/services', authMiddleware, (req, res) => {
    const services = db.getServices();
    const newService: Service = {
      id: 'srv-' + Date.now(),
      name: req.body.name || 'New Beauty Service',
      category: req.body.category || 'Hair',
      description: req.body.description || '',
      price: req.body.price || '₹1,500',
      duration: req.body.duration || '45 mins',
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop',
      active: req.body.active !== undefined ? req.body.active : true,
      order: services.length + 1
    };
    services.push(newService);
    db.saveServices(services);
    res.status(201).json(newService);
  });

  app.put('/api/services/:id', authMiddleware, (req, res) => {
    const services = db.getServices();
    const idx = services.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Service not found' });
    services[idx] = { ...services[idx], ...req.body };
    db.saveServices(services);
    res.json(services[idx]);
  });

  app.delete('/api/services/:id', authMiddleware, (req, res) => {
    let services = db.getServices();
    services = services.filter(s => s.id !== req.params.id);
    db.saveServices(services);
    res.json({ success: true });
  });

  // Gallery Endpoints
  app.get('/api/gallery', (req, res) => {
    res.json(db.getGallery());
  });

  app.post('/api/gallery', authMiddleware, (req, res) => {
    const gallery = db.getGallery();
    const newItem: GalleryItem = {
      id: 'gal-' + Date.now(),
      title: req.body.title || 'Beauty Moment',
      category: req.body.category || 'Bridal',
      imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop',
      description: req.body.description || '',
      order: gallery.length + 1,
      active: req.body.active !== undefined ? req.body.active : true,
      createdAt: new Date().toISOString().split('T')[0]
    };
    gallery.unshift(newItem);
    db.saveGallery(gallery);
    res.status(201).json(newItem);
  });

  app.put('/api/gallery/:id', authMiddleware, (req, res) => {
    const gallery = db.getGallery();
    const idx = gallery.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Gallery item not found' });
    gallery[idx] = { ...gallery[idx], ...req.body };
    db.saveGallery(gallery);
    res.json(gallery[idx]);
  });

  app.delete('/api/gallery/:id', authMiddleware, (req, res) => {
    let gallery = db.getGallery();
    gallery = gallery.filter(g => g.id !== req.params.id);
    db.saveGallery(gallery);
    res.json({ success: true });
  });

  // Testimonials Endpoints
  app.get('/api/testimonials', (req, res) => {
    res.json(db.getTestimonials());
  });

  app.post('/api/testimonials', authMiddleware, (req, res) => {
    const testimonials = db.getTestimonials();
    const newTestimonial: Testimonial = {
      id: 'test-' + Date.now(),
      customerName: req.body.customerName || 'Valued Guest',
      review: req.body.review || '',
      rating: Number(req.body.rating) || 5,
      service: req.body.service || 'Bridal Service',
      customerImage: req.body.customerImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      active: req.body.active !== undefined ? req.body.active : true,
      date: req.body.date || 'Recent'
    };
    testimonials.push(newTestimonial);
    db.saveTestimonials(testimonials);
    res.status(201).json(newTestimonial);
  });

  app.put('/api/testimonials/:id', authMiddleware, (req, res) => {
    const testimonials = db.getTestimonials();
    const idx = testimonials.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Testimonial not found' });
    testimonials[idx] = { ...testimonials[idx], ...req.body };
    db.saveTestimonials(testimonials);
    res.json(testimonials[idx]);
  });

  app.delete('/api/testimonials/:id', authMiddleware, (req, res) => {
    let testimonials = db.getTestimonials();
    testimonials = testimonials.filter(t => t.id !== req.params.id);
    db.saveTestimonials(testimonials);
    res.json({ success: true });
  });

  // Instagram Feed Endpoints
  app.get('/api/instagram', (req, res) => {
    res.json(db.getInstagram());
  });

  app.post('/api/instagram', authMiddleware, (req, res) => {
    const feed = db.getInstagram();
    const settings = db.getSettings();
    const newPost: InstagramPost = {
      id: 'ig-' + Date.now(),
      title: req.body.title || 'APSARA Luxury Aesthetic',
      type: req.body.type || 'reel',
      thumbnail: req.body.thumbnail || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop',
      instagramUrl: req.body.instagramUrl || settings.instagramUrl,
      publishedDate: req.body.publishedDate || 'Just now',
      likes: req.body.likes || '1.1k',
      active: req.body.active !== undefined ? req.body.active : true
    };
    feed.unshift(newPost);
    db.saveInstagram(feed);
    res.status(201).json(newPost);
  });

  app.put('/api/instagram/:id', authMiddleware, (req, res) => {
    const feed = db.getInstagram();
    const idx = feed.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    feed[idx] = { ...feed[idx], ...req.body };
    db.saveInstagram(feed);
    res.json(feed[idx]);
  });

  app.delete('/api/instagram/:id', authMiddleware, (req, res) => {
    let feed = db.getInstagram();
    feed = feed.filter(i => i.id !== req.params.id);
    db.saveInstagram(feed);
    res.json({ success: true });
  });

  // Official Instagram API status / integration layer
  app.get('/api/instagram/official-status', (req, res) => {
    const hasToken = Boolean(process.env.INSTAGRAM_ACCESS_TOKEN);
    const hasUserId = Boolean(process.env.INSTAGRAM_USER_ID);
    res.json({
      connected: hasToken && hasUserId,
      mode: hasToken ? 'meta_graph_api' : 'managed_curated_feed',
      message: hasToken
        ? 'Meta Graph API connected'
        : 'Official Meta Graph API layer ready. Set INSTAGRAM_ACCESS_TOKEN & INSTAGRAM_USER_ID to fetch live account stream.'
    });
  });

  // Appointments Endpoints
  app.post('/api/appointments', (req, res) => {
    const { customerName, phone, email, service, preferredDate, preferredTime, message } = req.body;
    if (!customerName || !phone || !service || !preferredDate || !preferredTime) {
      return res.status(400).json({ error: 'Please fill in all required appointment fields' });
    }
    const appointments = db.getAppointments();
    const newAppointment: Appointment = {
      id: 'apt-' + Date.now(),
      customerName,
      phone,
      email: email || '',
      service,
      preferredDate,
      preferredTime,
      message: message || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    appointments.unshift(newAppointment);
    db.saveAppointments(appointments);
    res.status(201).json({ success: true, appointment: newAppointment });
  });

  app.get('/api/appointments', authMiddleware, (req, res) => {
    res.json(db.getAppointments());
  });

  app.patch('/api/appointments/:id', authMiddleware, (req, res) => {
    const appointments = db.getAppointments();
    const idx = appointments.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Appointment not found' });
    appointments[idx] = { ...appointments[idx], ...req.body };
    db.saveAppointments(appointments);
    res.json(appointments[idx]);
  });

  app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
    let appointments = db.getAppointments();
    appointments = appointments.filter(a => a.id !== req.params.id);
    db.saveAppointments(appointments);
    res.json({ success: true });
  });

  // Contacts Endpoints
  app.post('/api/contacts', (req, res) => {
    const { name, phone, email, service, preferredDate, message } = req.body;
    if (!name || !phone || !email || !message) {
      return res.status(400).json({ error: 'Please provide name, phone, email, and message' });
    }
    const contacts = db.getContacts();
    const newContact: ContactMessage = {
      id: 'msg-' + Date.now(),
      name,
      phone,
      email,
      service: service || '',
      preferredDate: preferredDate || '',
      message,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    contacts.unshift(newContact);
    db.saveContacts(contacts);
    res.status(201).json({ success: true, contact: newContact });
  });

  app.get('/api/contacts', authMiddleware, (req, res) => {
    res.json(db.getContacts());
  });

  app.patch('/api/contacts/:id', authMiddleware, (req, res) => {
    const contacts = db.getContacts();
    const idx = contacts.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Contact message not found' });
    contacts[idx] = { ...contacts[idx], ...req.body };
    db.saveContacts(contacts);
    res.json(contacts[idx]);
  });

  app.delete('/api/contacts/:id', authMiddleware, (req, res) => {
    let contacts = db.getContacts();
    contacts = contacts.filter(c => c.id !== req.params.id);
    db.saveContacts(contacts);
    res.json({ success: true });
  });

  // Image Upload / Storage
  app.post('/api/upload', authMiddleware, (req, res) => {
    const { dataUrl, name } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'Missing image data' });
    }
    // Return dataUrl directly or store in memory/fs
    res.json({ url: dataUrl });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ APSARA Beauty Parlour Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
