require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/users/:username', (req, res) => {
  const { username } = req.params;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (user) {
      res.json(user);
    } else {
      db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json({ id: this.lastID, username, points: 0 });
        }
      });
    }
  });
});

app.post('/api/points/add', (req, res) => {
  const { user_id, amount, description } = req.body;
  db.serialize(() => {
    db.run('UPDATE users SET points = points + ? WHERE id = ?', [amount, user_id]);
    db.run('INSERT INTO point_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)', 
      [user_id, amount, 'earn', description], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
            if (err) {
              res.status(500).json({ error: err.message });
            } else {
              res.json(user);
            }
          });
        }
      });
  });
});

app.get('/api/points/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all('SELECT * FROM point_transactions WHERE user_id = ? ORDER BY created_at DESC', [user_id], (err, transactions) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(transactions);
    }
  });
});

app.get('/api/giftcards', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.GIFTSHOWBIZ_API_URL}/v1/cards`, {
      headers: {
        'Authorization': `Bearer ${process.env.GIFTSHOWBIZ_TOKEN_KEY}`,
        'Auth-Key': process.env.GIFTSHOWBIZ_AUTH_KEY
      },
      params: {
        card_id: process.env.GIFTSHOWBIZ_CARD_ID
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('GiftShowBiz API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch giftcards', details: error.response?.data });
  }
});

app.post('/api/giftcards/purchase', (req, res) => {
  const { user_id, giftcard_id, giftcard_name, price } = req.body;
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!user || user.points < price) {
      res.status(400).json({ error: 'Not enough points' });
    } else {
      db.serialize(() => {
        db.run('UPDATE users SET points = points - ? WHERE id = ?', [price, user_id]);
        db.run('INSERT INTO point_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)', 
          [user_id, -price, 'spend', `Purchase: ${giftcard_name}`]);
        db.run('INSERT INTO giftcard_purchases (user_id, giftcard_id, giftcard_name, price) VALUES (?, ?, ?, ?)', 
          [user_id, giftcard_id, giftcard_name, price], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
            } else {
              db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, updatedUser) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                } else {
                  res.json({ user: updatedUser, purchaseId: this.lastID });
                }
              });
            }
          });
      });
    }
  });
});

app.get('/api/purchases/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all('SELECT * FROM giftcard_purchases WHERE user_id = ? ORDER BY purchase_date DESC', [user_id], (err, purchases) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(purchases);
    }
  });
});

// 일일 출석 체크인
app.post('/api/checkin', (req, res) => {
  const { user_id } = req.body;
  const today = new Date().toISOString().split('T')[0];

  db.get('SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?', [user_id, today], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (existing) {
      res.status(400).json({ error: 'Already checked in today' });
    } else {
      db.get('SELECT * FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 1', [user_id], (err, lastCheckin) => {
        let streak = 1;
        if (lastCheckin) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (lastCheckin.checkin_date === yesterdayStr) {
            streak = lastCheckin.streak + 1;
          }
        }

        const reward = streak >= 7 ? 150 : streak >= 3 ? 100 : 50;

        db.serialize(() => {
          db.run('INSERT INTO checkins (user_id, checkin_date, streak) VALUES (?, ?, ?)', [user_id, today, streak]);
          db.run('UPDATE users SET points = points + ? WHERE id = ?', [reward, user_id]);
          db.run('INSERT INTO point_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
            [user_id, reward, 'earn', `출석체크 ${streak}일차`]);
          db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
            if (err) {
              res.status(500).json({ error: err.message });
            } else {
              res.json({ user, streak, reward });
            }
          });
        });
      });
    }
  });
});

app.get('/api/checkin/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.get('SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?', [user_id, new Date().toISOString().split('T')[0]], (err, checkin) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      db.get('SELECT * FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 1', [user_id], (err, lastCheckin) => {
        res.json({ checkedIn: !!checkin, streak: lastCheckin?.streak || 0 });
      });
    }
  });
});

// 리더보드
app.get('/api/leaderboard', (req, res) => {
  db.all('SELECT id, username, points FROM users ORDER BY points DESC LIMIT 100', (err, users) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(users);
    }
  });
});

// 업적
const ACHIEVEMENTS = {
  first_checkin: { id: 'first_checkin', name: '첫 출석', description: '첫 출석체크 달성', icon: '🎯' },
  week_streak: { id: 'week_streak', name: '주간 출석왕', description: '7일 연속 출석', icon: '🔥' },
  points_1000: { id: 'points_1000', name: '포인트 헌터', description: '포인트 1,000점 달성', icon: '💰' },
  points_5000: { id: 'points_5000', name: '포인트 마스터', description: '포인트 5,000점 달성', icon: '👑' },
  first_purchase: { id: 'first_purchase', name: '첫 구매', description: '첫 기프트카드 구매', icon: '🛒' },
  invite_3: { id: 'invite_3', name: '친구왕', description: '친구 3명 초대', icon: '👥' }
};

app.get('/api/achievements', (req, res) => {
  res.json(ACHIEVEMENTS);
});

app.get('/api/achievements/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all('SELECT * FROM achievements WHERE user_id = ?', [user_id], (err, achieved) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const achievedIds = achieved.map(a => a.achievement_id);
      const achievements = Object.values(ACHIEVEMENTS).map(a => ({
        ...a,
        achieved: achievedIds.includes(a.id)
      }));
      res.json(achievements);
    }
  });
});

app.post('/api/achievements/check', (req, res) => {
  const { user_id } = req.body;
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err || !user) {
      res.status(500).json({ error: 'User not found' });
      return;
    }
    db.all('SELECT * FROM achievements WHERE user_id = ?', [user_id], (err, achieved) => {
      const achievedIds = achieved.map(a => a.achievement_id);
      const newAchievements = [];

      if (!achievedIds.includes('points_1000') && user.points >= 1000) {
        db.run('INSERT INTO achievements (user_id, achievement_id) VALUES (?, ?)', [user_id, 'points_1000']);
        newAchievements.push(ACHIEVEMENTS.points_1000);
      }
      if (!achievedIds.includes('points_5000') && user.points >= 5000) {
        db.run('INSERT INTO achievements (user_id, achievement_id) VALUES (?, ?)', [user_id, 'points_5000']);
        newAchievements.push(ACHIEVEMENTS.points_5000);
      }

      res.json({ newAchievements });
    });
  });
});

// 친구 초대
app.post('/api/referral/register', (req, res) => {
  const { user_id, referral_code } = req.body;
  db.get('SELECT * FROM users WHERE referral_code = ?', [referral_code], (err, referrer) => {
    if (err || !referrer) {
      res.status(400).json({ error: 'Invalid referral code' });
      return;
    }
    if (referrer.id === user_id) {
      res.status(400).json({ error: 'Cannot refer yourself' });
      return;
    }
    db.get('SELECT * FROM referrals WHERE referred_id = ?', [user_id], (err, existing) => {
      if (existing) {
        res.status(400).json({ error: 'Already used referral code' });
        return;
      }
      db.serialize(() => {
        db.run('INSERT INTO referrals (referrer_id, referred_id) VALUES (?, ?)', [referrer.id, user_id]);
        db.run('UPDATE users SET points = points + 500 WHERE id = ?', [referrer.id]);
        db.run('UPDATE users SET points = points + 200 WHERE id = ?', [user_id]);
        db.run('INSERT INTO point_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [referrer.id, 500, 'earn', '친구 초대 보너스']);
        db.run('INSERT INTO point_transactions (user_id, amount, type, description) VALUES (?, ?, ?, ?)',
          [user_id, 200, 'earn', '추천인 코드 입력 보너스']);
        db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
          res.json({ user, referrerPoints: 500, referredPoints: 200 });
        });
      });
    });
  });
});

app.get('/api/referrals/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.all('SELECT u.username, u.points, r.created_at FROM referrals r JOIN users u ON r.referred_id = u.id WHERE r.referrer_id = ?', [user_id], (err, referrals) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(referrals);
    }
  });
});

// 추천인 코드 생성
app.post('/api/referral/generate', (req, res) => {
  const { user_id } = req.body;
  db.get('SELECT * FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err || !user) {
      res.status(500).json({ error: 'User not found' });
      return;
    }
    if (!user.referral_code) {
      const code = 'GP' + user.id.toString().padStart(4, '0') + Math.random().toString(36).substring(2, 6).toUpperCase();
      db.run('UPDATE users SET referral_code = ? WHERE id = ?', [code, user_id], (err) => {
        res.json({ referralCode: code });
      });
    } else {
      res.json({ referralCode: user.referral_code });
    }
  });
});

// 거래 내역 필터링
app.get('/api/points/:user_id/filter', (req, res) => {
  const { user_id } = req.params;
  const { type, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM point_transactions WHERE user_id = ?';
  const params = [user_id];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (startDate) {
    sql += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND created_at <= ?';
    params.push(endDate);
  }
  sql += ' ORDER BY created_at DESC';

  db.all(sql, params, (err, transactions) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(transactions);
    }
  });
});

// 설정
app.get('/api/settings/:user_id', (req, res) => {
  const { user_id } = req.params;
  db.get('SELECT settings FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(user?.settings ? JSON.parse(user.settings) : { notifications: true, darkMode: false });
    }
  });
});

app.post('/api/settings/:user_id', (req, res) => {
  const { user_id } = req.params;
  const settings = JSON.stringify(req.body);
  db.run('UPDATE users SET settings = ? WHERE id = ?', [settings, user_id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});