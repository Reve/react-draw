import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAPIClient } from "../../helpers/api";
import { IWhiteboard } from "../../cjt";
import { Table } from "@themesberg/react-bootstrap";
import LoadingView from "../../layout/LoadingView";
import { Button, Card, Container, Form, Modal } from "react-bootstrap";
import orderBy from "lodash/orderBy";

export default function WhiteboardsList() {
  const [whiteboards, setWhiteboards] = useState<IWhiteboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const client = useAPIClient();

  const fetchWhiteboards = async () => {
    setIsLoading(true);
    try {
      const data = await client.getWhiteboards();
      setWhiteboards(data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch whiteboards");
    }
    setIsLoading(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const handleCreated = async () => {
    try {
      await client.createWhiteboard(text);
      setShow(false);
      fetchWhiteboards();
      toast.success("Whiteboard created");
    } catch (err) {
      console.log(err);
      toast.error("Failed to create whiteboard");
    }
  };

  useEffect(() => {
    fetchWhiteboards();
  }, []);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <>
      <Container>
        <h1 className="text-center mt-4 mb-4">Whiteboards list</h1>
        <Card>
          <Card.Body>
        <Button variant="primary" onClick={() => setShow(true)}>
          Adaugă whiteboard
        </Button>
        <Table      responsive
            className="table-centered table-nowrap rounded mb-0"
       >
          <thead className="thead-light">
              <tr>
                <th className="border-0">#</th>
                <th className="border-0">Denumire</th>
                <th className="border-0"></th>
              </tr>
          </thead>
          <tbody>
          {orderBy(whiteboards, ["id"], ["desc"]).map((item, i) => (
          <tr key = {i}>
            <td>{i + 1}</td>
            <td>
              {item.name}
            </td>
            <td className="text-center">
                    <Button
                      href={`/whiteboard/session?id=${item.id}`}
                      className="btn-default font-weight-bold pr-3"
                      size="sm"
                    >
                      Join
                    </Button>
                  </td>
          </tr>
          ))
          
          }

          </tbody>
        </Table>
        </Card.Body>
        </Card>
      </Container>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Adaugă formular</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Denumire</Form.Label>
          <Form.Control
            value={text}
            onChange={handleChange}
            type="text"
            placeholder="Formular generic"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Închide
          </Button>
          <Button variant="primary" onClick={handleCreated}>
            Salvează
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
