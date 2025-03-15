import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    main: './frontend/js/main.js',
    alpine: './frontend/js/alpine-init.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'frontend/dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  }
}; 