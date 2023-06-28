crypto tracker with a solana wallet monitor and a sell flow that goes
through jupiter instead of an exchange. connect phantom, see what you
hold, sell to usdc either for real or as a paper trade.

you need node 18+, python 3.11+, and the phantom extension.

git clone https://github.com/tarann26/Crypto-Tracker.git
cd Crypto-Tracker
npm install
npm run dev

then in a second terminal:

cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

open the frontend url vite prints, connect phantom on the portfolio
page, and quote/sell from there. paper mode is on by default so
nothing touches the chain until you switch it to real.
