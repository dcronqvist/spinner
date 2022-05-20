import styled from "styled-components"

const StyledSidebar = styled.div`
    min-width: 200px;
    width: 300px;
    /* outline: 1px solid red; */
    height: calc(100% - 200px);
    display: flex;
    flex-direction: column;

    a {
        font-size: 20px;
        /* outline: 1px solid green; */
        cursor: pointer;
        margin-bottom: 30px;
        padding-left: 10px;
        height: 40px;
        display: flex;
        align-items: center;
        background-color: #374c59;

        :hover {
            background-color: #4e6c7f;
        }
    }
`

export interface SidebarProps {
    children?: any
}

const Sidebar = (props: SidebarProps) => (
    <StyledSidebar>
        {props.children}
    </StyledSidebar>
);

export default Sidebar