import { RaoWrapper } from '../../../../libs/rao-widget/src/RaoWrapper';

export function App() {
  return (
    <div>
      <RaoWrapper
        aragid="b4fe9f16-d6b9-444c-a60a-6c4ae8a29d45"
        account="6787bcbe-cc1c-4134-85f6-324104d9e1a3"
        apikey={import.meta.env.VITE_API_KEY}
        zone="europe-1"
        viewtype="floating"
        backend="https://stashify.cloud/api"
      />
    </div>
  );
}

export default App;
