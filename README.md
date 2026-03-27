# Weave Our Tapestry

Weave our tapestry serves as a platform for any users to post a specific story, myth, legend, epic, etc that ties to a culture of a nation, as well as informatively and educationally explore other cultures' stories.

> [!WARNING]
> WOT is still underdevelopment so in this readme you will only be able to view our progress.

## Installing

First you must clone our repo.
```
git clone https://github.com/PaullyScripter/weave-our-tapestry.git
```
### To set up the backend:

1. Go to root.
- If Windows:
```
python3 -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```
- If MacOS/Linux:
```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
2. Create backend/.env with your own Neon DATABASE_URL=...

### To set up the frontend:

1. Go to frontend folder.
``` 
npm install
```

## Running

> [!NOTE]
> You can only run this locally.

For backend (root):
```
python3 -m uvicorn backend.main:app --reload
```

For frontend:
```
npm run dev
```

## Links

- [Frontend](https://weaveourtapestry.netlify.app/)
- [Backend](https://weave-our-tapestry.onrender.com/)
- [API Docs](https://weave-our-tapestry.onrender.com/docs)
- [UI Prototype](https://www.figma.com/design/6eNdOs9eR4xgMxLMHayxBq/WOT?node-id=0-1&t=GlQmHQXrR2i0VWxH-1)

## Authors

- [@DTue](https://github.com/DTue)
- [@YuiAsak145](https://github.com/YuiAsak145)
- [@tituswzp](https://github.com/tituswzp)
- [@PaullyScripter](https://github.com/PaullyScripter)


## License

This project is licensed and protected under [GPL](https://www.gnu.org/licenses/gpl-3.0.en.html).






