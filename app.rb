
require 'json'
require 'sinatra'
require 'yaml'

$SCORE_FILE  = 'db/scores.yaml'
$SCORE_COUNT = 5
$SCORES      = nil

def list_scores
  read_scores if $SCORES.nil?

  JSON.generate($SCORES)
end

def new_score(score)
  read_scores if $SCORES.nil?
  
  scores = $SCORES.append(score)
  scores.sort! { |a, b| a[:score].to_i <=> b[:score].to_i }
  scores.reverse!
  $SCORES = scores[0..($SCORE_COUNT - 1)]
  write_scores
end

def read_scores
  if File.exist?($SCORE_FILE)
    $SCORES = File.open($SCORE_FILE) { |file| YAML.load(file) }
  else
    $SCORES = default_scores
    write_scores
  end
end

def write_scores
  File.open($SCORE_FILE, 'w') { |file| file.write(YAML.dump($SCORES)) }
end

def default_scores
  [
    { user: 'Anonymous', score: '5' },
    { user: 'Anonymous', score: '4' },
    { user: 'Anonymous', score: '3' },
    { user: 'Anonymous', score: '2' },
    { user: 'Anonymous', score: '1' }
  ]
end

configure do
  set :bind, '0.0.0.0'
end

get '/stroid-avoider' do
  erb :stroid
end

get '/stroid-avoider/highscores' do
  list_scores
end

put '/stroid-avoider/highscore/:user/:score' do |user, score|
  new_score({user: user, score: score})
  list_scores
end
