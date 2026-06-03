import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "@layout/Header.jsx";
import Footer from "@layout/Footer.jsx";
import Fab from "@layout/Fab.jsx";
import MainContentStyled from "@layout/MainContentStyled.jsx";

const MainLayout = () => {
  return (
    <>
       <MainContentStyled>
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Outlet />
      </Box>

      <Fab />
    </MainContentStyled>
    <Footer />
    </>
 
  );
};


export default MainLayout;