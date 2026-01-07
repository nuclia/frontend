import { RaoWrapper } from '../../../../libs/rao-widget/src/RaoWrapper';

export function App() {
  return (
    <div>
      <RaoWrapper
        aragid="cc3a6f24-bb9f-4009-b610-39df8a83b214"
        account="90288af7-5755-47bf-9700-d1ade78f7294"
        apikey={import.meta.env.VITE_API_KEY}
        zone="europe-1"
        backend="https://stashify.cloud/api"
      />
    </div>
  );
}

export default App;
