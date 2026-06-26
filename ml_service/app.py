from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)
CORS(app)

print("Loading Sentence Transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully!")

def cosine_similarity(vec_a, vec_b):
    dot = np.dot(vec_a, vec_b)
    mag_a = np.linalg.norm(vec_a)
    mag_b = np.linalg.norm(vec_b)
    if mag_a == 0 or mag_b == 0:
        return 0
    return dot / (mag_a * mag_b)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'model': 'all-MiniLM-L6-v2' })

@app.route('/match', methods=['POST'])
def match():
    data = request.json
    query = data.get('query', '')
    movies = data.get('movies', [])

    if not query or not movies:
        return jsonify({ 'error': 'query and movies are required' }), 400

    # Encode user query
    query_vec = model.encode(query)

    # Encode all movie texts and score them
    results = []
    for movie in movies:
        movie_text = f"{movie['title']} {movie['overview']} {movie['genre']}"
        movie_vec = model.encode(movie_text)
        score = cosine_similarity(query_vec, movie_vec)
        results.append({
            'imdb_id': movie['imdb_id'],
            'title': movie['title'],
            'overview': movie['overview'],
            'poster_path': movie['poster_path'],
            'release_year': movie['release_year'],
            'vote_average': movie['vote_average'],
            'genre': movie['genre'],
            'score': round(float(score), 4)
        })

    # Sort by score
    results.sort(key=lambda x: x['score'], reverse=True)
    top3 = results[:3]

    return jsonify({
        'matches': top3,
        'algorithm': 'Sentence Transformers (all-MiniLM-L6-v2)'
    })

if __name__ == '__main__':
    app.run(port=8000, debug=True)